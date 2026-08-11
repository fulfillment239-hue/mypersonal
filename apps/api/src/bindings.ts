/** Runtime bindings shared by Hono services in the Cloudflare Worker. */
export interface Bindings {
  DB: D1Database;
  CONTENT: R2Bucket;
  AUTH_PEPPER: string;
  TURNSTILE_SECRET?: string;
  APP_ORIGIN: string;
  ENVIRONMENT: "development" | "production";
  ACCESS_AUD?: string;
  ACCESS_TEAM_DOMAIN?: string;
}

export interface Variables {
  session?: SessionIdentity;
}

export interface SessionIdentity {
  id: string;
  username: string;
  role: "member" | "admin";
  csrf: string;
}

