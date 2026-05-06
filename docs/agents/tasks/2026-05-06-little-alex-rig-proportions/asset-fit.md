# Little Alex Asset Fit

## Scope

- Fix the remaining integrated QA failure where the new Playwright checks reported only `6.0px` of shoulder overlap.
- Reduce transparent Qwen canvas padding so each sprite fills its body wrapper naturally instead of looking like a small pasted cutout.

## Root Cause

- The rig branch connected the head, torso, and legs, but arm centers still sat too far outside the torso.
- Qwen assets were stored as full `512x512` transparent canvases, so the visible body parts were compressed inside the wrappers and looked disjointed even when the wrapper geometry was close.

## Fix

- Move arm anchors inward from `31px` to `27px` on each side.
- Trim transparent padding from the Little Alex sprite PNGs while preserving each generated part image.
- Strengthen the component shoulder overlap test to require at least `8px` of overlap.

## QA

- Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`.
- Rerun `npm run test:e2e -- little-alex-physics.spec.ts`.
- Inspect refreshed `test-results/little-alex-qwen-sprites/*.png` screenshots before final regression.
