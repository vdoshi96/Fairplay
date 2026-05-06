# Final QA

Final QA is not green on the isolated QA branch because the renderer and asset branches have not been merged here.

## 2026-05-06 QA Branch Run

- Command: `npm run test:e2e -- little-alex-physics.spec.ts`
- Result: failed as expected on the new sprite visual QA contract.
- Passing coverage before the blocker: 8 tests passed for global availability, drag/fling, desktop sidebar bounds, saved preferences and bubble phrase, idle standing/walking, constrained mobile viewport, mobile nav taps, and reduced-motion dragging.
- Failing coverage: `captures visual QA screenshots for all sprite presentations`.
- Failure reason: missing loaded images for:
  - `/assets/fairplay/little-alex-sprites/neutral-head.png`
  - `/assets/fairplay/little-alex-sprites/neutral-torso.png`
  - `/assets/fairplay/little-alex-sprites/neutral-leftArm.png`
  - `/assets/fairplay/little-alex-sprites/neutral-rightArm.png`
  - `/assets/fairplay/little-alex-sprites/neutral-leftLeg.png`
  - `/assets/fairplay/little-alex-sprites/neutral-rightLeg.png`
- Screenshot status: `test-results/little-alex-qwen-sprites/` was created, but no neutral/masculine/feminine screenshots were captured because the neutral sprite image loading assertion failed before screenshot capture.

## Re-run After Merge

Re-run `npm run test:e2e -- little-alex-physics.spec.ts` after the asset and renderer branches are merged. Expected new artifacts:

- `test-results/little-alex-qwen-sprites/neutral.png`
- `test-results/little-alex-qwen-sprites/masculine.png`
- `test-results/little-alex-qwen-sprites/feminine.png`
