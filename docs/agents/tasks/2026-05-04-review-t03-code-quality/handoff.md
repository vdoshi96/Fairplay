# Handoff

## Status

CHANGES_REQUESTED

## Findings

1. `src/server/repositories/auth-throttle.ts:35` - Failed-login throttling is read-then-write instead of atomic. `recordFailedLoginAttempt` reads the existing row, computes `nextFailedAttemptCount`, then writes that literal value through `upsert`. In a Vercel/serverless deployment, concurrent failed-login requests for the same username/IP can both read the same count and overwrite each other, delaying or bypassing throttling. This is a security and serverless-readiness issue.

## Required Fixes

1. T03 persistence owner: change auth-throttle writes to an atomic persistence operation. Acceptable fixes include a transaction with appropriate locking/isolation or a single update/upsert flow that uses Prisma atomic `increment` semantics and computes `throttledUntil` from the persisted count safely.
2. T03 persistence owner: add repository integration tests for repeated failed-login attempts and a concurrent-attempt case that proves `failedAttemptCount` cannot lose increments and `throttledUntil` is set when the threshold is reached.

## Verification

- `git status --short`: passed; clean before review.
- `npm run prisma:validate`: passed.
- `npm run prisma:generate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test -- --run src/server/repositories`: failed due to local DB limitation. Prisma cannot reach Postgres at `localhost:5432`, and all 10 repository integration tests fail at the first `prisma.household.create()` call.

## Notes

- No plaintext password or raw session token fields were found in the Prisma schema; persistence stores `passwordHash`, hash metadata, `tokenHash`, and `userAgentHash`.
- Load snapshots remain aggregate-only with no score/winner/loser fields.
- The migration is acceptable for an initial deploy at static-review level, but apply/seed verification still needs a live Postgres run.
- The review did not modify production code.
