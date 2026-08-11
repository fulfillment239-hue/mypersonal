# 462019 Portfolio

An English-first, bilingual personal portfolio built as a Cloudflare-native monorepo. The workspace requires Node.js 22 or newer, pnpm 11.16.0 and the pinned Wrangler 4.120.1 release.

## Local setup

1. Run `pnpm install`.
2. Copy `config/admin.example.env` to `config/admin.local.env` and set private values.
3. Apply `apps/api/migrations/0001_identity.sql` through Wrangler locally, then run `pnpm dev`.

## Cloudflare architecture

The release contains two Workers:

- `462019-content-api` owns D1 authentication data and R2 JSON/media access. It has no public `workers.dev` or preview URL.
- `mypersonal1` serves the Astro build and forwards same-origin `/api/*` requests through the `API` service binding to `462019-content-api`.

The service binding requires the API Worker to exist before the web Worker is deployed. The root `pnpm deploy` script therefore always deploys API first and web second.

## Cloudflare prerequisites

Before the first production deployment:

1. Add `462019.xyz` to the target Cloudflare account and review existing DNS records before creating the Custom Domain.
2. The production D1 database `462019-portfolio` is already bound in `apps/api/wrangler.jsonc`. Recreate it and update the ID only when moving to another Cloudflare account.
3. Create an R2 bucket named `462019-portfolio-content`.
4. The initial D1 migration is already applied. Set `AUTH_PEPPER`, `TURNSTILE_SECRET`, `ACCESS_AUD` and `ACCESS_TEAM_DOMAIN` as API Worker secrets before enabling account features.
5. Create the ignored local administrator config and run `pnpm admin:sync --remote`.
6. Configure Cloudflare Access policies for `/admin*` and `/api/admin/*`; production administrator requests require both Access and the D1 administrator session.
7. Attach `462019.xyz` as the web Worker's Custom Domain after the Workers are deployed. Both Workers disable `workers.dev` and preview URLs by design.

## Cloudflare Builds settings

Create two build configurations from the same repository. Keep both root directories at `/` so pnpm can resolve workspace packages.

API Worker (`462019-content-api`):

- **Build command:** `pnpm --filter @462019/api build`
- **Deploy command:** `pnpm deploy:api`

Web Worker (`mypersonal1`):

- **Build command:** `pnpm --filter @462019/web build`
- **Deploy command:** `pnpm deploy:web`

Deploy the API Worker once before enabling the web build. The root `pnpm deploy` command remains available for an authenticated local or release-machine deployment in the required API-to-web order. All deploy scripts use the pinned Wrangler release and explicit config paths.

The local administrator file is ignored by Git. Never commit passwords or Worker secrets.
The synchronizer accepts `AUTH_PEPPER` from the process environment and clears `ADMIN_PASSWORD` from the local file only after D1 reports success.
Password hashes use the Cloudflare Workers-supported PBKDF2-HMAC-SHA-256 ceiling of 100,000 iterations, a random 16-byte salt, a 32-byte output and the private Worker Pepper.
