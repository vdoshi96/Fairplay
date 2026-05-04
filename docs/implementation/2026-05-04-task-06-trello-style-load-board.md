# Task 6: Trello-Style Load Board

## Expectations

- Add board lane metadata for Cards of Concern, Player 1, Player 2, Kid Split, Not in Play, and Trimmed.
- Write failing tests first for lane headers/counts/explanations and the accessible keyboard/action-menu move fallback.
- Refactor the load map into a Trello-style horizontal board grouped by `boardLane`, while preserving existing filters and summary metrics.
- Add drag/drop with `@dnd-kit/core` and sortable utilities where feasible.
- Wire `/app/load-map` to pass a move callback that calls the planned `PATCH /api/responsibilities/[id]/board-placement` endpoint.

## Outputs

- Changed `src/components/responsibilities/board-lanes.ts`.
- Changed `src/components/responsibilities/responsibility-load-map.tsx`.
- Changed `src/components/responsibilities/responsibility-load-map.test.tsx`.
- Changed `src/app/app/load-map/page.tsx`.
- Added this report.
- RED: `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx` failed with missing lane regions and missing `Move Auto` action.
- GREEN: `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx` passed with 6 tests.
- Typecheck: `npm run typecheck` passed.
- Commit: Task 6 scoped commit created.

## Challenges

- Drag/drop behavior is wired through dnd-kit and computes a destination lane/sort order, but the component test coverage focuses on the accessible action-menu fallback because pointer drag simulation is brittle in jsdom.
- The page now calls the planned `PATCH /api/responsibilities/[id]/board-placement` URL. This depends on the parallel API worker landing that route and accepting `responsibilityId`, `toLane`, `sortOrder`, and `actorPersonaId`.
- The action-menu fallback intentionally sends only `responsibilityId` and `toLane`; the page supplies `sortOrder: 0` when the user moves through that fallback.

## Next Handoff

- API/repository worker should confirm the board-placement route contract matches the page callback payload.
- A follow-up browser pass should exercise real pointer/touch dragging once the route is available and the app can persist moves end to end.
