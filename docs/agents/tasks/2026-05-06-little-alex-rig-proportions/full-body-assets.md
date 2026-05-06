# Little Alex Coherent Full-Body Assets

## Why This Branch Exists

The separated Qwen body-part rig still looked visually wrong after wrapper-level QA passed. The visible screenshots showed disconnected limbs and duplicate clipboard art because the old contract generated separate paper-doll pieces and even asked for a clipboard on both torso and arm cells.

## Approach

- Keep the Matter.js body parts as hidden physics and bounds geometry.
- Render a single visible Qwen-generated full-body sprite per presentation on top of those physics bodies.
- Clamp the visible sprite against the same play area used by the physics rig.
- Preserve variant switching with `neutral-full.png`, `masculine-full.png`, and `feminine-full.png`.
- Remove the older separated body-part images from the rendered DOM entirely; body-part wrappers remain only as invisible Matter.js geometry.

## Asset Contract

- Original Fairplay helper character only; no internet mannequin or copied likeness.
- One complete coherent body, centered and full-length.
- Equal left/right arm lengths and equal left/right leg lengths.
- Black suit, white shirt, and exactly one tan clipboard.
- Feminine variant keeps visibly long hair.

## QA

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed with 22 tests.
- `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` passed with 9 tests.
- The e2e DOM contract asserts `0` legacy `little-alex-sprite` image nodes, no image children inside body-part wrappers, and computed opacity `0` for every body-part wrapper.
- The e2e visual QA now includes pixel recognition over the actual full-body PNGs:
  - significant visible body area is one near-connected component,
  - exactly one large central tan clipboard region,
  - full-body aspect ratio stays human-like,
  - left/right leg heights and areas stay within proportion thresholds.

## Visual Evidence

- `test-results/little-alex-qwen-sprites/neutral.png`
- `test-results/little-alex-qwen-sprites/masculine.png`
- `test-results/little-alex-qwen-sprites/feminine.png`
