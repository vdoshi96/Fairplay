# Task 2: Board Schema, Preferences, and Placement Contracts

## Expectations

- Add RED-first responsibility contract coverage for board placement, summary lane/sort exposure, and from-template creation.
- Add RED-first onboarding preferences contract coverage for persona-scoped welcome and crash-course state.
- Add Prisma support for board lanes, source card template metadata, responsibility source/placement fields, and persona onboarding preferences.
- Create the matching SQL migration for the schema changes.
- Validate Prisma and run targeted contract tests.

## Outputs

- Changed `prisma/schema.prisma`.
- Created `prisma/migrations/20260504190000_personal_use_redesign/migration.sql`.
- Changed `src/contracts/responsibilities.ts`.
- Changed `src/contracts/responsibilities.test.ts`.
- Created `src/contracts/preferences.ts`.
- Created `src/contracts/preferences.test.ts`.
- Created `docs/implementation/2026-05-04-task-02-board-schema-preferences.md`.
- RED: `npm test -- src/contracts/responsibilities.test.ts` failed on missing board schemas and summary fields.
- RED: `npm test -- src/contracts/preferences.test.ts` failed because `src/contracts/preferences.ts` did not exist.
- GREEN: `npm test -- src/contracts/responsibilities.test.ts src/contracts/preferences.test.ts` passed.
- GREEN: `npm run prisma:validate` passed.
- GREEN: `npm run prisma:generate` passed.
- Commit: created for this Task 2 change set.

## Challenges

- Existing ID contracts require UUIDs, so the new contract tests use UUID-shaped persona and responsibility IDs instead of short fixture IDs.
- An unrelated untracked `src/components/library/` directory is present in the worktree and was left untouched.

## Next Handoff

- Repository/API workers can consume `ResponsibilityBoardPlacementMutationSchema`, `ResponsibilityFromTemplateMutationSchema`, and onboarding preference contracts.
- Schema now exposes `boardLane`, `boardSortOrder`, source CPE fields, `coverAssetPath`, `sourceCoverAssetPath`, and persona-scoped onboarding preferences for persistence work.
