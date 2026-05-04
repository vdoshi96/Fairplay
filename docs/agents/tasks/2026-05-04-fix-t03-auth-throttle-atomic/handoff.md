# Handoff

## Status

DONE_WITH_CONCERNS

## Changes

- Updated `recordFailedLoginAttempt` to use a Prisma interactive transaction with atomic `failedAttemptCount: { increment: 1 }` on existing throttle rows.
- Kept first-attempt creation on the unique `(usernameNormalized, ipHash)` key and added a unique-conflict retry path for create races.
- Derived `throttledUntil` from the persisted failed-attempt count returned after the atomic upsert, rather than from a stale pre-update read.
- Added repository integration tests for repeated failed attempts and concurrent failed attempts.
- Preserved the existing repository API shape for future T04 auth work.

## Verification

- `git status --short --branch` before changes: clean on `codex/v1-app...origin/codex/v1-app`.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test -- --run src/server/repositories`: failed because Prisma cannot reach Postgres at `localhost:5432`.
- `git diff --check`: passed.
- `git status --short` before commit: showed only intended auth-throttle repository, repository integration test, task doc, manifest, and controller-log changes.

## DB-Limited Failure

```text
Invalid `prisma.household.create()` invocation:

Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```

Auth throttle tests hit the same local DB limitation at transaction start:

```text
PrismaClientInitializationError: Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```
