# Little Alex Rig Proportions

## Scope

- Kept the Qwen-generated Little Alex sprite paths and body-part render order.
- Added reduced-motion unit coverage for neck, hip, and shoulder overlap geometry.
- Adjusted the rig boxes so head, torso, arms, and legs assemble with closer natural connections in reduced motion and shared idle/physics poses.
- Changed sprite fitting from `contain` to `fill` so square PNGs occupy tall and narrow rig boxes.

## TDD Evidence

- RED: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
  - Failed on `keeps reduced-motion head, torso, and legs vertically connected`.
  - Current head-to-torso gap was `8px`, above the new `4px` maximum.
- GREEN: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
  - Passed after tightening rig dimensions, offsets, and joint points.

## Notes

- The head-to-torso reduced-motion gap is now within the natural connection threshold.
- The torso-to-leg connection remains overlapping or nearly touching.
- Shoulder overlap still preserves both horizontal and vertical contact.
