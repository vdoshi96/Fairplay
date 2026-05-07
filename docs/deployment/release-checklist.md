# Fairplay v1 Release Checklist

Date: 2026-05-04

Status: APPROVED_WITH_BLOCKERS.

## Verification Results

| Check | Result | Evidence |
| --- | --- | --- |
| Branch status | Pass | `git status --short --branch` showed clean `codex/v1-app...origin/codex/v1-app` before artifact creation. |
| Lint | Pass | `npm run lint` exited 0. |
| Typecheck | Pass | `npm run typecheck` exited 0. |
| Prisma schema | Pass | `npm run prisma:validate` reported schema valid. |
| DB startup | Blocked | `npm run db:up` failed with `sh: docker: command not found`. |
| DB wait | Blocked | `npm run db:wait` timed out; Prisma could not reach `localhost:5432`. |
| Migration verify | Blocked | `npm run prisma:migrate -- --name verify` not run because DB was unavailable. |
| Seed verify | Blocked | `npm run prisma:seed` not run because DB was unavailable. |
| Full Vitest | Blocked | `npm test -- --run` failed only in DB integration tests because Postgres was unreachable. |
| Non-DB Vitest fallback | Pass | `npm test -- --run --exclude src/server/repositories/persistence.integration.test.ts` passed, 52 files and 199 tests. |
| Playwright e2e | Pass | `npm run test:e2e` passed on clean sequential rerun, 10 tests. |
| Production build | Pass | `rm -rf .next && npm run build` passed on clean sequential rerun. |
| Browser verification | Pass with limitation | `/login` rendered at `390x844` and `1440x1000`; protected `/app/home` redirected to `/login`; storage/cookies were empty; no console errors. Authenticated persisted flow not verified because DB unavailable. |
| Browser storage scan | Pass with expected theme-only storage | `localStorage` is allowed only for non-sensitive device theme preference. Household data, private drafts, sensitive notes, concern details, session secrets, API keys, and credentials must not be stored in `localStorage`, `sessionStorage`, or `indexedDB`; cookies should remain server-managed/session scoped. |
| Restricted terms | Pass with expected matches | Required scan found legitimate matches in tests, safety/disclaimer copy, product docs, and agent artifacts. |
| Security/privacy source review | Pass with DB limitation | Password hashing, session token hashing, cookie flags, and no-secret response tests are present. DB-backed repository security tests are blocked by Postgres. |
| IP/safety source review | Pass | No full starter catalog, copied source labels, partner score/morality/diagnosis/confrontation prompt, or unsafe check-in framing found in reviewed production surfaces. |

## Required Before Production Release

- Run DB setup in an environment with Docker or an externally configured Postgres-compatible `DATABASE_URL`.
- Run `npm run db:wait`.
- Run `npm run prisma:migrate -- --name verify` or the production-equivalent migration command.
- Run `npm run prisma:seed` against a disposable verification database.
- Rerun `npm test -- --run` and require `src/server/repositories/persistence.integration.test.ts` to pass.
- Complete a live persisted browser flow: create household, choose persona, complete onboarding, create/update at least one responsibility/check-in record, verify persisted reload behavior, and inspect cookies/storage. Confirm browser storage contains only non-sensitive theme preference and no household data, private drafts, sensitive notes, concern details, session secrets, API keys, credentials, or plaintext passwords.

## Residual Risks

- Production database readiness is unproven in this workspace.
- Live persisted auth/session behavior is unproven in this workspace.
- Route-mocked e2e coverage is useful but does not prove DB persistence or repository scoping.
- Cookie `secure` is production-only by source review; this was not validated over HTTPS in a deployed production environment.

## 2026-05-07 Local Radar Removal Verification

- Applied `20260507120000_remove_radar` to the local Postgres database.
- Reran `npm run test -- --run`; all 85 test files and 475 tests passed, including DB-backed repository integration tests.

## Exact Blocker Output

`npm run db:up`

```text
> fairplay@0.1.0 db:up
> docker compose up -d postgres

sh: docker: command not found
```

`npm run db:wait`

```text
Timed out waiting for the database.
PrismaClientInitializationError:
Invalid `prisma.$queryRaw()` invocation:

Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```

`npm test -- --run`

```text
Test Files  1 failed | 52 passed (53)
Tests  13 failed | 199 passed (212)

All failures were in src/server/repositories/persistence.integration.test.ts and reported that the database server at localhost:5432 could not be reached.
```

## PR Readiness

Implementation PR should remain draft for release purposes until DB-backed verification and live persisted browser verification pass. Broader review can begin if reviewers accept the DB blocker as explicitly unresolved.
