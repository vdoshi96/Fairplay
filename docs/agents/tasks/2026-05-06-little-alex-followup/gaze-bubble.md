# Gaze and Fling Bubble

## Responsibility

Own the Little Alex gaze tracking and chat-bubble trigger fixes on `codex/little-alex-gaze-bubble`.

## Changes

- Added observable gaze state through `data-gaze-direction` and CSS variables for horizontal/vertical eye movement.
- Updated desktop pointer and mobile touch listeners so Little Alex looks toward the cursor or the latest touch point.
- Added drag tracking for start point, max distance, and release velocity.
- Changed bubble behavior so a simple click does not show the phrase, while a real drag/fling release does.
- Added Playwright assertions for desktop gaze and click-not-bubble behavior in the drag/fling flow.

## QA

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx` passed with 12 tests.
- `npm run typecheck` passed.
- `npm run lint` passed.

## Blockers

- None in this branch. Final integration still needs the full Playwright pass after merging with bounds and appearance.

## Achievement

Little Alex now has testable attention tracking and the phrase bubble is tied to meaningful fling/drag activity instead of ordinary clicks.
