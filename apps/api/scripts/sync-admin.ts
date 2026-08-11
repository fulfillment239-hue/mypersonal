/** Local-only administrator synchronizer. It hashes credentials before D1 receives them. */
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { hashPassword } from "../src/crypto";

const configuration = readLocalConfiguration();
const passwordHash = await hashPassword(configuration.password, configuration.pepper);
const command = process.argv.includes("--remote") ? "--remote" : "--local";
const sqlFile = createSqlFile(configuration, passwordHash);

try {
  execFileSync("pnpm", ["wrangler", "d1", "execute", "462019-portfolio", command, "--file", sqlFile], { stdio: "inherit" });
  console.log("Administrator synchronized. Remove ADMIN_PASSWORD from config/admin.local.env after use.");
} finally {
  rmSync(join(sqlFile, ".."), { recursive: true, force: true });
}

function readLocalConfiguration(): { username: string; password: string; accessEmail: string; pepper: string } {
  const file = join(process.cwd(), "../../config/admin.local.env");
  const entries = Object.fromEntries(readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map((line) => line.split(/=(.*)/s).map((value) => value.trim())));
  const username = entries.ADMIN_USERNAME?.toLowerCase();
  const password = entries.ADMIN_PASSWORD;
  const accessEmail = entries.ACCESS_EMAIL?.toLowerCase();
  const pepper = entries.AUTH_PEPPER;
  if (!username?.match(/^[a-z0-9_]{3,32}$/) || !password || password.length < 12 || !accessEmail || !pepper) throw new Error("Fill ADMIN_USERNAME, ADMIN_PASSWORD, ACCESS_EMAIL and AUTH_PEPPER in config/admin.local.env.");
  return { username, password, accessEmail, pepper };
}

function createSqlFile(config: { username: string; accessEmail: string }, passwordHash: string): string {
  const quoted = (value: string) => `'${value.replaceAll("'", "''")}'`;
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const sql = [
    "BEGIN;",
    `INSERT INTO users (id, username_norm, username_display, password_hash, role, status, auth_version, created_at, updated_at) VALUES (${quoted(id)}, ${quoted(config.username)}, ${quoted(config.username)}, ${quoted(passwordHash)}, 'admin', 'active', 1, ${quoted(now)}, ${quoted(now)}) ON CONFLICT(username_norm) DO UPDATE SET password_hash = excluded.password_hash, role = 'admin', status = 'active', auth_version = users.auth_version + 1, updated_at = excluded.updated_at;`,
    `DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE username_norm = ${quoted(config.username)});`,
    `INSERT INTO admin_access_bindings (user_id, access_email) SELECT id, ${quoted(config.accessEmail)} FROM users WHERE username_norm = ${quoted(config.username)} ON CONFLICT(user_id) DO UPDATE SET access_email = excluded.access_email, access_subject = NULL;`,
    "COMMIT;"
  ].join("\n");
  const folder = mkdtempSync(join(tmpdir(), "462019-admin-"));
  const file = join(folder, "sync.sql");
  writeFileSync(file, sql, { encoding: "utf8", mode: 0o600 });
  return file;
}
