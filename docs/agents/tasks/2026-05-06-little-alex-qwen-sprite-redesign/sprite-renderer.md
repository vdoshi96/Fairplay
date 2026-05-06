# Sprite Renderer

## 2026-05-06

- Branch: `codex/little-alex-sprite-renderer`
- Implemented raster sprite rendering inside the existing six Little Alex body wrappers.
- Sprite URLs follow the asset branch contract:
  `/assets/fairplay/little-alex-sprites/{neutral|masculine|feminine}-{head|torso|leftArm|rightArm|leftLeg|rightLeg}.png`
- Preserved semantic hooks for `little-alex-shirt`, `little-alex-clipboard`, hair, face, silhouette, skin tone, and presentation metadata while hiding the old CSS-drawn visuals.
- Moved arm offsets from `-42/+42` to `-26/+26` and routed body creation plus idle poses through the shared part config so shoulder bounds overlap in reduced motion and physics setup.

## Test Evidence

- RED: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
  - Failed on missing sprite images, feminine long-hair metadata, and detached shoulder overlap.
- GREEN: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
  - Passed: 20 tests.
- `npm run typecheck`
  - Passed.
