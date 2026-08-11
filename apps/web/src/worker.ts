/** Cloudflare web gateway serves static assets and forwards same-origin API requests internally. */
export interface Env {
  ASSETS: Fetcher;
  API: Fetcher;
}

const SECURITY_HEADERS: Record<string, string> = {
  // Astro emits a small inline hydration bootstrap; user content is never rendered as HTML.
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY"
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === "www.462019.xyz") return canonicalRedirect(url);
    const response = url.pathname.startsWith("/api/")
      ? await env.API.fetch(request)
      : await env.ASSETS.fetch(request);
    return withSecurityHeaders(response);
  }
} satisfies ExportedHandler<Env>;

/** Redirect the secondary hostname while retaining path and query details. */
function canonicalRedirect(url: URL): Response {
  url.hostname = "462019.xyz";
  return Response.redirect(url.toString(), 308);
}

/** Copy immutable upstream headers and apply the public security policy. */
function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
