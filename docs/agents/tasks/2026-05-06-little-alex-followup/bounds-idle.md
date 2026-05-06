# Bounds and Idle Movement

Branch: `codex/little-alex-bounds-idle`

## Responsibilities

- Keep Little Alex inside the visible app play area, including the desktop `16rem` sidebar gutter.
- Add a longer stand-up delay after drag/fling release without changing the untouched idle delay.
- Make idle behavior calmer: stand still first, then walk slowly in turn-based horizontal directions.
- Make the walk planner testable: each turn moves at least 5% of the play area and direction is held for at least three turns before random changes.

## Changes

- Added `playAreaBounds()` and routed anchor clamps, Matter walls, body containment, drag movement, idle pose, resize handling, and bubble clamping through the desktop-safe play area.
- Changed idle timing from immediate walking after the idle delay to `active -> standing -> walking`.
- Added a 6.5s post-release stand-up delay, 1.5s longer than the untouched 5s delay.
- Added turn planning with a 5% minimum horizontal distance and three-turn minimum before random direction changes.
- Hardened pointer coordinate handling so tests and drag events cannot leak `NaN` into reduced-motion transforms.
- Clamped in-progress idle walk targets during resize so Alex cannot get stuck walking toward an unreachable pre-resize coordinate.

## Tests

- Red observed: `npm test -- src/components/little-alex/little-alex-physics.test.tsx`
  - New tests failed against the old implementation for direct-to-walking idle, old post-release delay, sidebar unsafe reduced-motion drag, and missing turn planner.
- Green observed: `npm test -- src/components/little-alex/little-alex-physics.test.tsx`
  - 13 tests passed after adding the resize target regression case.
- Green observed: `npm run typecheck`
  - Passed.
- Green observed: `npm run lint`
  - Passed with no warnings after adding the missing hook dependency.
- Green observed: `npm run test:e2e -- little-alex-physics.spec.ts`
  - 8 Playwright tests passed.

## Achievement Notes

- Desktop side-panel safety is covered in unit tests for reduced-motion drag and in Playwright by checking all rendered body parts stay at `left >= 256`.
- Idle is now mostly static before walking, with walking represented as slow target seeking rather than per-frame unbounded drift.
- Turn direction is deterministic for the first three turns in a run and random only after the minimum has been met.

## Blockers

- None.
