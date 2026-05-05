# Task 3: Feature Tour Markers and Launchers

## Expectations

Add user-triggered feature tour launchers to Load Map, Library, Radar, and Check-ins using the committed guide foundation. Add stable `data-guide-id` targets for each feature tour without changing server/API behavior or existing workflows.

## Outputs

- Added `FeatureGuideLauncher` instances wired to `FEATURE_GUIDES.loadMap`, `FEATURE_GUIDES.library`, `FEATURE_GUIDES.radar`, and `FEATURE_GUIDES.checkIns`.
- Added stable guide markers for Load Map board, lanes, move controls, and filters.
- Added stable guide markers for Library search, labels, and put-in-play actions.
- Added stable guide markers for Radar creation, visibility, and item actions.
- Added stable guide markers for Check-in agenda/current item, decisions, and completion/start controls.
- Extended focused component tests to prove launchers and markers are present.

## Verification

- Red: `npx vitest run src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx` failed for missing `Learn this feature` buttons and missing `data-guide-id` attributes.
- Green: `npx vitest run src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx` passed with 34 tests across 4 files.

## Challenges

The feature launcher depends on `useSearchParams`, so the owned component tests needed a small `next/navigation` mock. Check-ins have both a launcher state and an active flow state, so the guide markers were added to both the new check-in agenda preview and the active current-item/decision/completion workflow.
