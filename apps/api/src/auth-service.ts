/** D1 identity service for members and the second gate used by administrators. */
import { hashPassword, randomToken, sha256, verifyPassword } from "./crypto";
import type { Bindings, SessionIdentity } from "./bindings";

const reservedNames = new Set(["admin", "root", "system", "support", "462019"]);
const memberSessionSeconds = 60 * 60 * 24 * 30;
const adminSessionSeconds = 60 * 60 * 8;

interface UserRow {
  id: string;
  username_display: string;
  password_hash: string;
  role: "member" | "admin";
  status: "active" | "suspended";
  auth_version: number;
}

type SessionUser = Omit<UserRow, "password_hash">;

export class AuthService {
  constructor(private readonly env: Bindings) {}

  async register(username: string, password: string, email?: string): Promise<SessionResult> {
    if (reservedNames.has(username)) throw new AuthError("This username is reserved.", 409);
    const now = new Date().toISOString();
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password, this.env.AUTH_PEPPER);
    try {
      await this.env.DB.prepare(
        "INSERT INTO users (id, username_norm, username_display, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).bind(userId, username, username, email ?? null, passwordHash, now, now).run();
    } catch {
      throw new AuthError("This username is unavailable.", 409);
    }
    await this.env.DB.prepare("INSERT INTO user_preferences (user_id, updated_at) VALUES (?, ?)").bind(userId, now).run();
    return this.createSession({ id: userId, username_display: username, role: "member", status: "active", auth_version: 1 });
  }

  async login(username: string, password: string): Promise<SessionResult> {
    const row = await this.env.DB.prepare(
      "SELECT id, username_display, password_hash, role, status, auth_version FROM users WHERE username_norm = ?"
    ).bind(username).first<UserRow>();
    const valid = await verifyPassword(password, this.env.AUTH_PEPPER, row?.password_hash ?? await this.dummyHash());
    if (!row || !valid || row.status !== "active") throw new AuthError("Invalid username or password.", 401);
    return this.createSession(row);
  }

  async getSession(token: string): Promise<SessionIdentity | null> {
    const tokenHash = await sha256(token);
    const row = await this.env.DB.prepare(
      "SELECT u.id, u.username_display, u.role, u.status, u.auth_version, s.csrf_hash, s.auth_version AS session_version, s.expires_at, s.revoked_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?"
    ).bind(tokenHash).first<Record<string, string | number | null>>();
    if (!row || row.status !== "active" || row.revoked_at || row.auth_version !== row.session_version || new Date(String(row.expires_at)) <= new Date()) return null;
    return { id: String(row.id), username: String(row.username_display), role: row.role as SessionIdentity["role"], csrf: String(row.csrf_hash) };
  }

  async logout(token: string): Promise<void> {
    await this.env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE token_hash = ?").bind(new Date().toISOString(), await sha256(token)).run();
  }

  async favorites(userId: string): Promise<string[]> {
    const result = await this.env.DB.prepare("SELECT project_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC").bind(userId).all<{ project_id: string }>();
    return result.results.map((row) => row.project_id);
  }

  async addFavorite(userId: string, projectId: string): Promise<void> {
    await this.env.DB.prepare("INSERT OR IGNORE INTO favorites (user_id, project_id, created_at) VALUES (?, ?, ?)").bind(userId, projectId, new Date().toISOString()).run();
  }

  async removeFavorite(userId: string, projectId: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND project_id = ?").bind(userId, projectId).run();
  }

  async preferences(userId: string): Promise<{ locale: "en" | "zh-CN" }> {
    const row = await this.env.DB.prepare("SELECT locale FROM user_preferences WHERE user_id = ?").bind(userId).first<{ locale: "en" | "zh-CN" }>();
    return row ?? { locale: "en" };
  }

  async updatePreferences(userId: string, locale: "en" | "zh-CN"): Promise<void> {
    await this.env.DB.prepare("UPDATE user_preferences SET locale = ?, updated_at = ? WHERE user_id = ?").bind(locale, new Date().toISOString(), userId).run();
  }

  async changePassword(userId: string, current: string, next: string): Promise<void> {
    const row = await this.env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(userId).first<{ password_hash: string }>();
    if (!row || !(await verifyPassword(current, this.env.AUTH_PEPPER, row.password_hash))) throw new AuthError("Invalid username or password.", 401);
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(next, this.env.AUTH_PEPPER);
    await this.env.DB.batch([
      this.env.DB.prepare("UPDATE users SET password_hash = ?, auth_version = auth_version + 1, updated_at = ? WHERE id = ?").bind(passwordHash, now, userId),
      this.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId)
    ]);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.env.DB.prepare("DELETE FROM users WHERE id = ? AND role = 'member'").bind(userId).run();
  }

  async issueCsrf(token: string): Promise<string | null> {
    const session = await this.getSession(token);
    if (!session) return null;
    const next = randomToken();
    await this.env.DB.prepare("UPDATE sessions SET csrf_hash = ? WHERE token_hash = ?").bind(await sha256(next), await sha256(token)).run();
    return next;
  }

  private async createSession(user: SessionUser): Promise<SessionResult> {
    const token = randomToken();
    const csrf = randomToken();
    const now = new Date();
    const duration = user.role === "admin" ? adminSessionSeconds : memberSessionSeconds;
    const expires = new Date(now.getTime() + duration * 1000).toISOString();
    await this.env.DB.prepare(
      "INSERT INTO sessions (token_hash, user_id, csrf_hash, auth_version, created_at, last_used_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(await sha256(token), user.id, await sha256(csrf), user.auth_version, now.toISOString(), now.toISOString(), expires).run();
    return { token, csrf, role: user.role, expires };
  }

  private async dummyHash(): Promise<string> {
    return hashPassword("not-a-real-password", this.env.AUTH_PEPPER);
  }
}

export interface SessionResult {
  token: string;
  csrf: string;
  role: "member" | "admin";
  expires: string;
}

export class AuthError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}
