# Handoff

## Status

APPROVED_WITH_NOTES

## Findings

- None.

## Prior Finding Resolution

- Resolved: `src/server/repositories/auth-throttle.ts` no longer computes a stale literal failed-attempt count from a separate pre-write read.
- The repository now records failed attempts inside an interactive Prisma transaction and updates existing rows with `failedAttemptCount: { increment: 1 }`.
- `throttledUntil` is derived after the atomic upsert returns the persisted post-increment row. The threshold check uses `throttle.failedAttemptCount`, then stores the throttle expiry in the same transaction.
- Initial create races are handled by retrying once when the unique `(usernameNormalized, ipHash)` key collides.

## Test Coverage Confirmation

- Repeated failed attempts: `src/server/repositories/persistence.integration.test.ts` now verifies counts 1, 2, and 3 and confirms `throttledUntil` is stored when threshold 3 is reached.
- Concurrent failed attempts: `src/server/repositories/persistence.integration.test.ts` now fires 8 parallel failed attempts for one username/IP key and expects the persisted count to be 8 with a throttle expiry.

## Persistence Quality Re-Check

- Prisma client remains build-safe and development-global cached; Prisma does not connect until query execution.
- Initial migration is present at `prisma/migrations/20260504000000_init/migration.sql`.
- Repository boundaries remain scoped around household/persona ownership from the prior T03 persistence fix.
- Seed remains idempotent through slug-based `responsibilityTemplate.upsert`.
- Prisma schema stores password/session material as hashes (`passwordHash`, `tokenHash`, `userAgentHash`) and hash metadata; no plaintext password or raw session token schema fields were found.
- `LoadSnapshot` remains aggregate-only and has no score, winner, or loser fields.

## Verification

- `git status --short`: passed; clean before review artifact edits.
- `npm run prisma:validate`: passed; Prisma reported the schema is valid.
- `npm run prisma:generate`: passed; generated Prisma Client v6.19.3.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed with the existing edge-runtime static-generation warning.
- `npm test -- --run src/server/repositories`: failed because Prisma cannot reach Postgres at `localhost:5432`. Vitest collected 1 file and 12 tests; all 12 failed before behavioral assertions due to the DB connection limitation.

## DB-Limited Failure

```text
Can't reach database server at `localhost:5432`

Please make sure your database server is running at `localhost:5432`.
```

Representative failure points:

- `Invalid prisma.household.create() invocation` in `createHouseholdWithPersonas`.
- `recordFailedLoginAttempt` fails at `prisma.$transaction` for auth-throttle tests.
- Cleanup for auth-throttle tests also fails at `prisma.authThrottle.deleteMany()`.

## Owner

No implementation owner action required for this code-quality re-review. A DB-capable verification owner should rerun the repository integration suite against live Postgres.
