/** Hono API Worker for public portfolio content, accounts and administrator actions. */
import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { LoginSchema, RegistrationSchema } from "@462019/contracts";
import type { Bindings, SessionIdentity, Variables } from "./bindings";
import { AuthError, AuthService } from "./auth-service";
import { contentRepository, type ContentKind } from "./content-repository";
import { clearSessionCookie, requireCsrf, sessionCookie, sessionToken } from "./http";
import { verifyAccess } from "./access";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();
type AppContext = Context<{ Bindings: Bindings; Variables: Variables }>;

app.use("*", async (context, next) => {
  context.header("X-Content-Type-Options", "nosniff");
  context.header("Referrer-Policy", "strict-origin-when-cross-origin");
  await next();
});

app.use("/api/*", async (context, next) => {
  const token = sessionToken(context.req.raw);
  if (token) context.set("session", await new AuthService(context.env).getSession(token) ?? undefined);
  await next();
});

app.use("/api/*", (context, next) => cors({ origin: context.env.APP_ORIGIN, credentials: true })(context, next));

app.get("/api/v1/site", async (context) => context.json(await contentRepository(context.env).getSite()));
app.get("/api/v1/categories", async (context) => context.json(await contentRepository(context.env).getCategories()));

app.get("/api/v1/projects", async (context) => {
  const category = context.req.query("category");
  const projects = (await contentRepository(context.env).getProjects()).filter((project) => project.status === "published");
  return context.json(category ? projects.filter((project) => project.categoryId === category) : projects);
});

app.get("/api/v1/projects/:slug", async (context) => {
  const project = (await contentRepository(context.env).getProjects()).find((item) => item.slug === context.req.param("slug") && item.status === "published");
  return project ? context.json(project) : context.json({ error: "Project not found." }, 404);
});

app.post("/api/v1/auth/register", async (context) => {
  const payload = RegistrationSchema.safeParse(await context.req.json());
  if (!payload.success || !(await verifyTurnstile(payload.data.turnstileToken, context.env))) return context.json({ error: "Registration could not be verified." }, 400);
  return beginSession(context, () => new AuthService(context.env).register(payload.data.username, payload.data.password, payload.data.email));
});

app.post("/api/v1/auth/login", async (context) => {
  const payload = LoginSchema.safeParse(await context.req.json());
  if (!payload.success) return context.json({ error: "Invalid username or password." }, 401);
  return beginSession(context, () => new AuthService(context.env).login(payload.data.username, payload.data.password));
});

app.post("/api/v1/auth/logout", async (context) => {
  const token = sessionToken(context.req.raw);
  if (token) await new AuthService(context.env).logout(token);
  context.header("Set-Cookie", clearSessionCookie());
  return context.body(null, 204);
});

app.get("/api/v1/auth/session", (context) => {
  const session = context.get("session");
  return context.json(session ? { username: session.username, role: session.role } : { user: null });
});

app.get("/api/v1/auth/csrf", async (context) => {
  const token = sessionToken(context.req.raw);
  if (!token) return context.json({ error: "Authentication required." }, 401);
  const csrfToken = await new AuthService(context.env).issueCsrf(token);
  return csrfToken ? context.json({ csrfToken }) : context.json({ error: "Authentication required." }, 401);
});

app.post("/api/v1/auth/change-password", async (context) => {
  const session = await requireMemberMutation(context);
  const payload = z.object({ currentPassword: z.string().min(1), nextPassword: z.string().min(12).max(128) }).safeParse(await context.req.json());
  if (!session || !payload.success) return context.json({ error: "Request denied." }, 403);
  await new AuthService(context.env).changePassword(session.id, payload.data.currentPassword, payload.data.nextPassword);
  context.header("Set-Cookie", clearSessionCookie());
  return context.body(null, 204);
});

app.delete("/api/v1/account", async (context) => {
  const session = await requireMemberMutation(context);
  if (!session || session.role !== "member") return context.json({ error: "Request denied." }, 403);
  await new AuthService(context.env).deleteAccount(session.id);
  context.header("Set-Cookie", clearSessionCookie());
  return context.body(null, 204);
});

app.get("/api/v1/me/preferences", async (context) => {
  const session = context.get("session");
  if (!session) return context.json({ error: "Authentication required." }, 401);
  return context.json(await new AuthService(context.env).preferences(session.id));
});

app.put("/api/v1/me/preferences", async (context) => {
  const session = await requireMemberMutation(context);
  const payload = z.object({ locale: z.enum(["en", "zh-CN"]) }).safeParse(await context.req.json());
  if (!session || !payload.success) return context.json({ error: "Request denied." }, 403);
  await new AuthService(context.env).updatePreferences(session.id, payload.data.locale);
  return context.body(null, 204);
});

app.get("/api/v1/me/favorites", async (context) => {
  const session = context.get("session");
  if (!session) return context.json({ error: "Authentication required." }, 401);
  return context.json(await new AuthService(context.env).favorites(session.id));
});

app.post("/api/v1/me/favorites", async (context) => {
  const session = await requireMemberMutation(context);
  if (!session) return context.json({ error: "Request denied." }, 403);
  const payload = z.object({ projectId: z.string().uuid() }).safeParse(await context.req.json());
  if (!payload.success) return context.json({ error: "Invalid project." }, 400);
  await new AuthService(context.env).addFavorite(session.id, payload.data.projectId);
  return context.body(null, 204);
});

app.delete("/api/v1/me/favorites/:projectId", async (context) => {
  const session = await requireMemberMutation(context);
  if (!session) return context.json({ error: "Request denied." }, 403);
  await new AuthService(context.env).removeFavorite(session.id, context.req.param("projectId"));
  return context.body(null, 204);
});

app.get("/api/admin/v1/overview", async (context) => {
  const session = await requireAdmin(context);
  if (!session) return context.json({ error: "Administrator access required." }, 403);
  const projects = await contentRepository(context.env).getProjects();
  return context.json({ username: session.username, projects: projects.length, environment: context.env.ENVIRONMENT });
});

app.get("/api/admin/v1/content/:kind", async (context) => {
  if (!(await requireAdmin(context))) return context.json({ error: "Administrator access required." }, 403);
  const kind = contentKind(context.req.param("kind"));
  return kind ? context.json(await contentRepository(context.env).getAdminContent(kind)) : context.json({ error: "Unknown content type." }, 404);
});

app.put("/api/admin/v1/content/:kind", async (context) => {
  if (!(await requireAdmin(context, true))) return context.json({ error: "Administrator access required." }, 403);
  const kind = contentKind(context.req.param("kind"));
  if (!kind) return context.json({ error: "Unknown content type." }, 404);
  await contentRepository(context.env).replaceAdminContent(kind, await context.req.json());
  return context.body(null, 204);
});

app.notFound((context) => context.json({ error: "Not found." }, 404));

app.onError((error, context) => {
  if (error instanceof AuthError) return context.json({ error: error.message }, error.status === 409 ? 409 : 401);
  console.error(error);
  return context.json({ error: "Unexpected server error." }, 500);
});

async function beginSession(context: AppContext, create: () => Promise<import("./auth-service").SessionResult>) {
  const result = await create();
  context.header("Set-Cookie", sessionCookie(result.token, result.expires));
  return context.json({ role: result.role, csrfToken: result.csrf, expires: result.expires }, 201);
}

async function requireMemberMutation(context: AppContext): Promise<SessionIdentity | null> {
  const session = context.get("session");
  return session && await requireCsrf(context, session) ? session : null;
}

async function requireAdmin(context: AppContext, needsCsrf = false): Promise<SessionIdentity | null> {
  const session = context.get("session");
  if (!session || session.role !== "admin" || (needsCsrf && !(await requireCsrf(context, session)))) return null;
  const access = await verifyAccess(context.req.header("Cf-Access-Jwt-Assertion"), context.env);
  if (!access) return null;
  const binding = await context.env.DB.prepare("SELECT access_email, access_subject FROM admin_access_bindings WHERE user_id = ?").bind(session.id).first<{ access_email: string; access_subject: string | null }>();
  return binding?.access_email === access.email && (!binding.access_subject || binding.access_subject === access.subject) ? session : null;
}

async function verifyTurnstile(token: string, env: Bindings): Promise<boolean> {
  if (env.ENVIRONMENT !== "production") return token === "dev-token";
  if (!env.TURNSTILE_SECRET) return false;
  const body = new FormData();
  body.set("secret", env.TURNSTILE_SECRET);
  body.set("response", token);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body });
  const result = await response.json<{ success: boolean; hostname?: string; action?: string }>();
  return result.success && result.hostname === new URL(env.APP_ORIGIN).hostname && result.action === "register";
}

function contentKind(value: string): ContentKind | null {
  return ["site", "categories", "projects", "media"].includes(value) ? value as ContentKind : null;
}

export default app;
