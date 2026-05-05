# Task 5: Card Library and Rich Detail

## Expectations

- Add TDD-covered `CardLibrary` and `CardDetailSheet` UI using local `coverAssetPath` assets.
- Support source-card search, label filtering, stable card dimensions, and a `Put in play` callback.
- Render a rich detail surface with cover/face, labels, lane/owner, CPE sections, standards, notes, move actions, and radar/check-in/trim action hooks.
- Create `/app/app/library/page.tsx` from `FAIRPLAY_SOURCE_CARDS` until card-template APIs land.
- Update responsibility detail only as needed without breaking existing editor tests.

## Outputs

- Created `src/components/library/card-library.tsx`.
- Created `src/components/library/card-library.test.tsx`.
- Created `src/components/cards/card-detail-sheet.tsx`.
- Created `src/components/cards/card-detail-sheet.test.tsx`.
- Created `src/app/app/library/page.tsx`.
- Updated `src/app/app/responsibilities/[id]/page.tsx` to render the new detail sheet above the existing editor, enriching from local source cards when titles match.
- Updated `src/components/responsibilities/responsibility-editor.test.tsx` fixture for required board placement fields from the parallel responsibility contract work.
- Tests run:
  - `npm test -- src/components/library/card-library.test.tsx` RED: failed because `CardLibrary` did not exist.
  - `npm test -- src/components/library/card-library.test.tsx` GREEN: 2 tests passed.
  - `npm test -- src/components/cards/card-detail-sheet.test.tsx` RED: failed because `CardDetailSheet` did not exist.
  - `npm test -- src/components/cards/card-detail-sheet.test.tsx` GREEN: 1 test passed after implementation fixes.
  - `npm test -- src/components/library/card-library.test.tsx src/components/cards/card-detail-sheet.test.tsx src/components/responsibilities/responsibility-editor.test.tsx` GREEN: 7 tests passed.
  - `npm run typecheck` failed on out-of-scope files still adapting to required `boardLane`/`boardSortOrder`: `src/components/responsibilities/responsibility-load-map.test.tsx`, `src/server/repositories/responsibilities.ts`, and `src/server/responsibilities/service.test.ts`.
- Commits created: none yet.

## Challenges

- Task 3 card-template APIs are not available, so the library page uses `FAIRPLAY_SOURCE_CARDS` directly and `Put in play` is disabled on the route because no server action/API exists in this ownership scope.
- Responsibility detail data does not yet expose source-template ids or full CPE fields. The detail page currently matches local source cards by normalized title as a temporary bridge.
- Full typecheck is blocked by parallel board-placement contract changes in files outside Worker 5 ownership.

## Next Handoff

- When Task 3 APIs land, replace the direct `FAIRPLAY_SOURCE_CARDS` import in `/app/app/library/page.tsx` with the card-template list endpoint/repository and wire `onCreateFromTemplate`.
- Add source-template ids to responsibility detail data so the rich detail page can hydrate from a durable template relation instead of title matching.
- The next worker handling load-map/server ownership should add `boardLane` and `boardSortOrder` to remaining fixtures/repository mappers so full `npm run typecheck` can pass.
