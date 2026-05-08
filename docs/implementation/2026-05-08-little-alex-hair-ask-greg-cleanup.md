# Little Alex Hair And Ask Greg Cleanup

## Summary

This follow-up adds Little Alex hair color customization in Settings and removes the duplicate small Greg avatar from the Ask Greg page composition.

## Changes

- Added a persisted `hairColor` preference for Little Alex, including Prisma enum/migration, Zod contracts, API/repository support, and Settings swatches.
- Passed saved hair color into the desktop Little Alex helper.
- Corrected the initial hair-color rendering approach: the hand-shaped CSS overlay looked like a separate blob and did not recolor the actual sprite hair. Little Alex now uses generated transparent PNG hair layers derived from the existing Little Alex sprite pixels for each gender presentation, hair color, and full/head state.
- Added `scripts/generate-little-alex-hair-colors.mjs` so hair layers can be regenerated deterministically from the approved tone-2 Little Alex sprites.
- Kept the Card Library `Ask Greg` control unchanged while allowing `/app/ask-greg` to hide the manager's small Greg avatar, leaving only the large Greg asset on that page.
- Tightened Playwright selectors where the new "Dark brown" hair button made the dark-mode test's "Dark" theme lookup ambiguous.

## Verification

- `npm run db:up` was attempted, but local Docker is not installed in this environment.
- `npm run db:wait`
- `npm run prisma:migrate`
- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run` with local Postgres env defaults (84 files, 495 tests)
- `npm run build`
- `npx playwright test e2e/dark-mode-visual.spec.ts`
- `npm run test:e2e` (28 Playwright tests)

Rendered/e2e QA now covers saving Auburn hair for Little Alex, seeing the saved hair color on the desktop helper, and keeping exactly one Greg image in the Ask Greg DOM.

## Corrective QA

After visual review, the CSS overlay approach was rejected because it painted a separate shape on top of Little Alex instead of recoloring the baked PNG hair. The follow-up implementation removed the overlay DOM/CSS, generated sprite-derived hair layers, and verified neutral/masculine/feminine full and head composites in `test-results/little-alex-hair-recolor/`. A rendered app spot check saved Auburn hair and confirmed the desktop helper used the sprite-derived `neutral-auburn-full-hair.png` layer with zero old hair-overlay nodes.
