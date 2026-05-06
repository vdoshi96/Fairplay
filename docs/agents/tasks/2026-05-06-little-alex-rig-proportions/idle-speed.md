# Idle Speed

## Scope

- Branch: `codex/little-alex-idle-speed`
- Files owned: Little Alex physics component, focused physics tests, this task note.

## TDD Evidence

- Added failing coverage for the first idle-walk movement step expecting `0.36px`.
- Red run: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` failed because the measured step was `0.72px`.

## Implementation

- Reduced `IDLE_WALK_STEP_PX` from `0.72` to `0.36`.
- Left idle turn planning unchanged so the existing five-percent viewport minimum remains covered.

## Verification

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
- `npm run typecheck`
- `npm run lint`
