# Task 3: Template, Placement, and Preference APIs

## Expectations

- Add repository and API coverage for source card templates, from-template responsibility creation, board placement updates, and persona-scoped onboarding preferences.
- Follow TDD with failing tests first, then implementation, then targeted verification.
- Keep changes scoped to Worker 6 ownership files.

## Outputs

- Added `src/server/repositories/card-templates.ts` and `src/server/repositories/card-templates.test.ts`.
- Added `src/server/repositories/preferences.ts` and `src/server/repositories/preferences.test.ts`.
- Updated `src/server/repositories/responsibilities.ts` with board placement/source-template creation support.
- Updated `src/server/repositories/persistence.integration.test.ts` with board lane event persistence coverage.
- Added API route implementations and tests for card templates, from-template creation, board placement, onboarding preferences, and welcome replay.
- Tests run:
  - `npm test -- src/server/repositories/card-templates.test.ts` RED: failed before implementation because `./card-templates` did not exist.
  - `npm test -- src/server/repositories/preferences.test.ts` RED: failed before implementation because `./preferences` did not exist.
  - `npm test -- src/app/api/card-templates/route.test.ts` RED: failed before implementation because `./route` did not exist.
  - `npm test -- src/app/api/responsibilities/from-template/route.test.ts` RED: failed before implementation because `./route` did not exist.
  - `npm test -- 'src/app/api/responsibilities/[id]/board-placement/route.test.ts'` RED: failed before implementation because `./route` did not exist.
  - `npm test -- src/app/api/preferences/onboarding/route.test.ts` RED: failed before implementation because `./route` did not exist.
  - `npm test -- src/app/api/preferences/welcome/replay/route.test.ts` RED: failed before implementation because `./route` did not exist.
  - `npm test -- src/app/api/card-templates/route.test.ts src/app/api/responsibilities/from-template/route.test.ts 'src/app/api/responsibilities/[id]/board-placement/route.test.ts' src/app/api/preferences/onboarding/route.test.ts src/app/api/preferences/welcome/replay/route.test.ts` GREEN: 5 files, 10 tests passed.
  - `npm run typecheck` GREEN: passed with exit code 0.
  - `npm run db:up` BLOCKED: `docker: command not found`.
  - `npm test -- src/server/repositories/card-templates.test.ts src/server/repositories/preferences.test.ts src/server/repositories/persistence.integration.test.ts src/app/api/card-templates/route.test.ts src/app/api/responsibilities/from-template/route.test.ts 'src/app/api/responsibilities/[id]/board-placement/route.test.ts' src/app/api/preferences/onboarding/route.test.ts src/app/api/preferences/welcome/replay/route.test.ts` PARTIAL: route tests passed; DB-backed repository/integration tests failed because Postgres was unreachable at `localhost:5432`.
- Commit: pending.

## Challenges

- Local Docker is not installed, and no Postgres server is reachable at `localhost:5432`, so repository/integration GREEN could not be verified in this environment.

## Next Handoff

- Re-run the DB-backed repository tests in an environment with Postgres running and migrations applied.
- The mocked route tests and TypeScript compiler pass here; remaining risk is runtime repository behavior against the real Prisma database.
