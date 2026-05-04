# Handoff

## Status

CHANGES_REQUESTED

## Required Fixes

1. T03 persistence owner: add and commit an initial Prisma migration for the current Postgres schema, then verify it applies cleanly against Postgres. Docker absence on this reviewer machine does not remove the deployment requirement.
2. T03 persistence owner: tighten repository boundaries so reads and writes are scoped by `householdId` and, where privacy requires it, selected persona. Validate related responsibility/radar/check-in/persona ids belong to the household inside repository operations, not only in future route handlers.
3. T03 persistence owner: make template ids comply with the UUID string id requirement or document and get approval for an explicit exception. Current seeded template ids are stable slugs, not UUIDs.

## Verification Results

- `git status --short`: clean before review.
- `git diff --name-only 6b81645b3e4161e4bcbccb0e6ee2130aa244336b..5d20d6d9b34022eb7da4da02bee5013394105d18`: listed T03 persistence, compose/env, package scripts, and T03 task artifact files only.
- `npm run prisma:validate`: passed.
- `npm run prisma:generate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `npm test -- --run src/server/repositories`: failed because Prisma cannot reach database server at `localhost:5432`.

## Review Notes

- Schema includes all required T03 model names.
- `usernameNormalized` is unique on `Household`.
- `@@unique([householdId, key])` enforces one Alex and one Max persona per household.
- No plaintext password or raw session token fields were found.
- `compose.yaml` defines local Postgres and `.env.example` uses local placeholders with a warning to keep real credentials out of source.
- The review did not modify production code.

