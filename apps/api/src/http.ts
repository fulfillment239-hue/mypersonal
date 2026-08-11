/** HTTP helpers centralize cookie, origin and CSRF decisions for mutation routes. */
import type { Context } from "hono";
import type { Bindings, SessionIdentity, Variables } from "./bindings";
import { sha256 } from "./crypto";

export function sessionToken(request: Request): string | undefined {
  const cookie = request.headers.get("Cookie") ?? "";
  return cookie.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith("__Host-portfolio_session="))?.split("=")[1];
}

export function sessionCookie(token: string, expires: string): string {
  return `__Host-portfolio_session=${token}; Path=/; Secure; HttpOnly; SameSite=Lax; Expires=${new Date(expires).toUTCString()}`;
}

export function clearSessionCookie(): string {
  return "__Host-portfolio_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0";
}

export async function requireCsrf(context: Context<{ Bindings: Bindings; Variables: Variables }>, session: SessionIdentity): Promise<boolean> {
  const origin = context.req.header("Origin");
  const token = context.req.header("X-CSRF-Token");
  if (!origin || origin !== context.env.APP_ORIGIN || !token) return false;
  return (await sha256(token)) === session.csrf;
}

