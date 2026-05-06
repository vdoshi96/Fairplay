# Final QA

## 2026-05-06 Integrated Main Run

- `npm run assets:generate-little-alex -- --dry-run`: passed before restoring the production manifest.
- `npm test -- src/server/ai/little-alex-sprite-assets.test.ts src/components/little-alex/little-alex-physics.test.tsx --run`: passed, 22 tests.
- `npm run prisma:generate`: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test -- --run`: passed, 95 files and 501 tests.
- `npm run test:e2e -- little-alex-physics.spec.ts`: passed, 9 tests.
- `npx eslint e2e/little-alex-physics.spec.ts`: passed after hardening the idle-walk timing assertion.
- `npm run test:e2e -- guided-learning.spec.ts`: passed, verifying the one full-suite flake was not persistent.
- `npm run test:e2e`: passed on rerun, 23 tests.
- `npm run build`: passed.

## Visual QA

- Qwen source sheets were generated one per presentation and cropped into 18 transparent sprites.
- Final screenshot artifacts were captured and inspected:
  - `test-results/little-alex-qwen-sprites/neutral.png`
  - `test-results/little-alex-qwen-sprites/masculine.png`
  - `test-results/little-alex-qwen-sprites/feminine.png`
- Visual inspection passed for visibly distinct variants, feminine long hair, black suit, white shirt, clipboard, loaded sprite assets, viewport containment, and no desktop-sidebar overlap.

## Notes

- The first full `npm run test:e2e` pass failed in `guided-learning.spec.ts` while Little Alex tests stayed green. The guided-learning spec passed standalone, and the full suite passed on rerun.
- The idle-walk e2e assertion was hardened because under parallel load the walking state could complete between Playwright polls while `data-idle-walk-turns` already proved a walking turn occurred.
