# 462019.xyz implementation plan

## Completed

- [x] Created an isolated Git repository and pnpm workspace.
- [x] Locked the public portfolio, JSON content, D1 account, R2 media and Cloudflare deployment architecture.
- [x] Added shared Zod contracts, bilingual JSON seeds and responsive hero media.
- [x] Implemented the Astro public site, category and project routes, account entry and administration shell.
- [x] Implemented D1 migrations, password/session primitives, Access verification and R2 JSON revisions.
- [x] Completed local type checks, unit tests, static build, Worker dry run and desktop/mobile visual checks.
- [x] Pinned Node.js 22+ and Wrangler 4.120.1 at the monorepo root.
- [x] Added explicit API-first/web-second deployment scripts for Cloudflare Builds.
- [x] Disabled production `workers.dev` and preview URLs and set the API production origin/environment.
- [x] Created and migrated the production D1 database, enabled R2 and uploaded JSON seed content.
- [x] Deployed the internal API Worker and the public web Worker with a service binding between them.
- [x] Added Turnstile registration verification, production secrets and hardened response headers.
- [x] Bound `462019.xyz` and `www.462019.xyz`, including the canonical HTTPS redirect.
- [x] Configured Cloudflare Access for both administrator routes and synchronized the first D1 administrator.
- [x] Enabled retained Worker invocation logs and adapted PBKDF2 to Cloudflare's 100,000-iteration platform limit.

## In progress

- [x] Re-synchronize the administrator hash with Cloudflare-compatible parameters.
- [ ] Complete the first interactive administrator-password smoke test.
- [x] Refreshed the public portfolio with a lightweight editorial layout inspired by Lusion's visual language, while retaining the original Nailong artwork and independent branding.
- [x] Limited motion to one pointer-responsive hero treatment and one viewport reveal treatment, with reduced-motion cleanup.

## Deployment checklist

- [x] Configure separate repository-root Cloudflare Builds commands for the API and web Workers.
- [x] Keep the web `API` service binding pointed at `462019-content-api`.
- [x] Create the production D1 database and bind its real database ID.
- [x] Enable R2, create the production bucket and upload JSON seed content.
- [x] Set `AUTH_PEPPER` and `TURNSTILE_SECRET` Worker secrets.
- [x] Set `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` after Cloudflare Access was configured.
- [x] Apply the production D1 identity migration.
- [x] Synchronize the ignored local administrator configuration and clear the plaintext password.
- [x] Bind `462019.xyz` after reviewing existing DNS records.
- [x] Configure Access policies for `/admin*` and `/api/admin/*` with a six-hour Access session.
