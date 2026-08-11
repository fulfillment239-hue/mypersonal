/** Cloudflare Access verification is a mandatory second identity check for admins. */
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Bindings } from "./bindings";

export interface AccessIdentity {
  email: string;
  subject: string;
}

export async function verifyAccess(token: string | undefined, env: Bindings): Promise<AccessIdentity | null> {
  if (!token || !env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
  const certificates = createRemoteJWKSet(new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`));
  try {
    const result = await jwtVerify(token, certificates, { audience: env.ACCESS_AUD });
    const email = typeof result.payload.email === "string" ? result.payload.email.toLowerCase() : "";
    if (!email || !result.payload.sub) return null;
    return { email, subject: result.payload.sub };
  } catch {
    return null;
  }
}

