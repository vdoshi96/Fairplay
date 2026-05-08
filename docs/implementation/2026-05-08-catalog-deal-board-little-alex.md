# Catalog Deal Board And Little Alex Fix

Date: 2026-05-08

## Requested Scope

Fix the card catalog model so Library and Deal represent the same full source catalog, remove the Library put-in-play workflow, remove the Board Unassigned lane, prevent duplicate catalog cards, normalize existing duplicate local/dev rows safely, and repair Little Alex mobile grab/drag/fling behavior without broad visual changes.

## What Changed

- Materialized one household responsibility per source card template before responsibility overview reads.
- Added a partial unique database index on active `(householdId, templateId)` rows and a migration that archives duplicate same-template rows before creating the index.
- Kept distinct source cards with similar titles separate by using stable `templateId` identity, not title matching.
- Changed Deal to derive available cards from the full catalog-backed overview instead of Library-created unassigned instances.
- Removed visible Library lane/put-in-play controls from the source catalog flow.
- Removed the Board Unassigned section; Board now renders only Alex, Max, Save for later, and Not applicable.
- Kept remove-from-board behavior for real Board categories so it clears categorization and returns the card to the dealable pool.
- Deduped card-state selectors so a stale unassigned duplicate cannot appear beside an assigned/categorized canonical card.
- Separated Little Alex grab/drag state from ragdoll state. Touch hold now grabs, movement follows the finger, pointer/touch cancel does not fling, and ragdoll/fling state starts only on intentional release behavior.

## Verification

- `npm run prisma:validate`
- `npm run prisma:generate` via `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` (89 files / 538 tests)
- `npm run build`
- `npx playwright test e2e/corrective-responsive-visual.spec.ts e2e/little-alex-physics.spec.ts --project=chromium`
- `npx playwright test e2e/guided-learning.spec.ts --project=chromium`
- `npx playwright test e2e/auth-onboarding.spec.ts --project=chromium`
- `npx playwright test e2e/corrective-responsive-visual.spec.ts --project=chromium`
- `npm run test:e2e -- --workers=1` (28 tests)

`npm run prisma:migrate -- --skip-seed` was blocked locally by Prisma shadow-database permissions (`P3014`). The same migration was applied to the local Postgres database with `prisma migrate deploy`, which succeeded.

Two default-parallel `npm run test:e2e` attempts hit unrelated Next dev-server runtime 500/JSON parse errors while multiple workers compiled pages. The affected specs passed directly, and the complete e2e suite passed with one worker.
