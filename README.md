# 462019 Portfolio

An English-first, bilingual personal portfolio built as a Cloudflare-native monorepo.

## Local setup

1. Run `pnpm install`.
2. Copy `config/admin.example.env` to `config/admin.local.env` and set private values.
3. Apply `apps/api/migrations/0001_identity.sql` through Wrangler locally, then run `pnpm dev`.

## Cloudflare release

1. Create a D1 database named `462019-portfolio` and an R2 bucket named `462019-portfolio-content`.
2. Replace `REPLACE_WITH_D1_DATABASE_ID` in `apps/api/wrangler.jsonc`.
3. Set `AUTH_PEPPER` with `wrangler secret put AUTH_PEPPER` in the API workspace. Add Turnstile and Access secrets before enabling production registration or `/admin`.
4. Run `pnpm admin:sync --remote` after creating the local ignored administrator config.
5. Deploy the API Worker first, then build and deploy the web Worker. Bind `462019.xyz` only after reviewing existing DNS records.
6. In Cloudflare Access, protect `/admin*` and `/api/admin/*`; production admin requests require both Access and the D1 administrator session.

The browser-facing API stays same-origin at `/api/*`; the web Worker forwards it to the private API service binding.

The local administrator file is ignored by Git. Never commit passwords or Worker secrets.
