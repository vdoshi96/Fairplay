# Task 1: Guide Foundation

## Expectations

- Create reusable guide content for Load Map, Library, Radar, Check-ins, and Settings.
- Build a `GuidedTour` overlay that blocks background interaction, highlights visible `[data-guide-id]` targets, shows a fallback when a target is absent, and exits through Skip, Done, or Escape.
- Build a `FeatureGuideLauncher` with the helper mascot and a user-triggered `Learn this feature` action, with query-string auto-start only when `guide` matches the feature guide id.

## Outputs

- Added `src/components/guide/guide-content.ts` with the five feature guide definitions and stable downstream target ids.
- Added `src/components/guide/guided-tour.tsx` with overlay, highlight, fallback, navigation, and Escape handling.
- Added `src/components/guide/feature-guide-launcher.tsx` with helper mascot, description copy, launch button, and query-based initial open state.
- Added focused tests for the tour and launcher behavior.

## Verification

- Red run: `npx --no-install vitest run src/components/guide/guided-tour.test.tsx src/components/guide/feature-guide-launcher.test.tsx` failed because `./guided-tour` and `./feature-guide-launcher` did not exist.
- Green run: `npx vitest run src/components/guide/guided-tour.test.tsx src/components/guide/feature-guide-launcher.test.tsx` passed 2 files and 7 tests.

## Challenges

- The first `npx vitest` attempt used a temporary runner before the local binary was reachable and failed while loading Vitest config dependencies. Re-running with the local dependency path confirmed the intended red failure, and the final required command used the local Vitest runner successfully.
