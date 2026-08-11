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

## In progress

- [ ] Configure Cloudflare Access and synchronize the first administrator account.

## Deployment checklist

- [x] Configure separate repository-root Cloudflare Builds commands for the API and web Workers.
- [x] Keep the web `API` service binding pointed at `462019-content-api`.
- [x] Create the production D1 database and bind its real database ID.
- [x] Enable R2, create the production bucket and upload JSON seed content.
- [x] Set `AUTH_PEPPER` and `TURNSTILE_SECRET` Worker secrets.
- [ ] Set `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` after Cloudflare Access is configured.
- [x] Apply the production D1 identity migration.
- [ ] Synchronize the ignored local administrator configuration.
- [x] Bind `462019.xyz` after reviewing existing DNS records.
- [ ] Configure Access policies for `/admin*` and `/api/admin/*`.
