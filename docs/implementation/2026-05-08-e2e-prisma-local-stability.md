# Local E2E And Prisma Stability

Date: 2026-05-08

## Request

Fix the local test server flakiness and Prisma local database permission issue so future Fairplay work can run full verification without rediscovering the same blockers.

## Root Causes

- Playwright ran against `next dev --port 3101` while tests were fully parallel. The dev server occasionally produced transient compile/runtime failures during full e2e runs.
- Switching to `next start` exposed missing runtime env in the Playwright web server: local production mode needs `DATABASE_URL` and `SESSION_SECRET`.
- `prisma migrate dev` tried to create its own shadow database with the `fairplay` app role. The local role does not have `CREATEDB`, causing Prisma `P3014`.

## Changes

- `npm run test:e2e` now runs `npm run build && playwright test`.
- Playwright now starts `next start --port 3101`, does not reuse an existing server, and injects local `APP_BASE_URL`, `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `SESSION_SECRET` values.
- Prisma now declares `shadowDatabaseUrl = env("SHADOW_DATABASE_URL")`.
- Prisma npm scripts provide local default `DATABASE_URL` and `SHADOW_DATABASE_URL`.
- `npm run prisma:migrate` now runs `npm run db:shadow` before `prisma migrate dev`.
- `scripts/db/ensure-shadow-db.mjs` checks the configured shadow database, creates it with the app user when allowed, and falls back to a localhost admin `psql -d postgres` connection when the app user lacks `CREATEDB`.
- Fresh Docker Compose Postgres volumes create `fairplay_shadow` through `scripts/db/init/01-create-shadow-db.sql`.
- Added `scripts/dev-tooling-config.test.ts` to lock the server/shadow DB tooling expectations.
- Hardened Little Alex e2e checks that were flaky for timing, page-animation screenshot noise, and subpixel viewport rounding.

## Verification

- `git diff --check`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` (90 files, 540 tests)
- `npm run prisma:migrate -- --skip-seed`
- `npm run test:e2e` (28 tests)

## Notes

- `.env.local` was not read.
- `References/` was not read.
- Real deployments still need environment-specific `DATABASE_URL` and `SESSION_SECRET`; the new defaults are only for local npm/Playwright workflows.
