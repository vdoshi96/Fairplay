# Qwen Assets

## Responsibility

Owned by `codex/little-alex-qwen-assets`.

## Implementation

- Added `src/server/ai/little-alex-sprite-assets.ts` to define three Qwen source sheets: `neutral-sheet`, `masculine-sheet`, and `feminine-sheet`.
- Each sheet is generated as a 1536x1024 paper-doll source image with six matching parts in a strict 3x2 grid.
- The crop order is:
  - row 1: `head`, `torso`, `leftArm`
  - row 2: `rightArm`, `leftLeg`, `rightLeg`
- Added `scripts/generate-little-alex-sprites.mjs`.
- The generator writes source sheets to `public/assets/fairplay/little-alex-sprites/source-sheets/`.
- The generator crops each 512x512 cell, removes edge-connected green or light paper background into alpha, and writes final renderer sprites to `public/assets/fairplay/little-alex-sprites/`.
- Added `assets:generate-little-alex` and declared `sharp` as an explicit dev dependency for deterministic image validation/cropping.

## Matching Strategy

The first prototype used independent body-part prompts. That was rejected because parts could drift from one another. The final workflow uses one Qwen generation per presentation so each variant's parts share the same skin tone, hair color, suit fabric, line weight, and clipboard styling.

## Generated Assets

- `neutral-head.png`, `neutral-torso.png`, `neutral-leftArm.png`, `neutral-rightArm.png`, `neutral-leftLeg.png`, `neutral-rightLeg.png`
- `masculine-head.png`, `masculine-torso.png`, `masculine-leftArm.png`, `masculine-rightArm.png`, `masculine-leftLeg.png`, `masculine-rightLeg.png`
- `feminine-head.png`, `feminine-torso.png`, `feminine-leftArm.png`, `feminine-rightArm.png`, `feminine-leftLeg.png`, `feminine-rightLeg.png`

## QA Evidence

- `npm run assets:generate-little-alex -- --dry-run`: passed.
- `npm test -- src/server/ai/little-alex-sprite-assets.test.ts --run`: passed.
- `npm run assets:generate-little-alex -- --env-file /Users/vishal/Developer/Fairplay/.env.local --delay-ms=15000`: generated three Qwen source sheets and 18 transparent sprites.
- `npm run assets:generate-little-alex -- --reuse-source-sheets --delay-ms=0`: recropped committed source sheets after improving edge-connected background removal.
- `file public/assets/fairplay/little-alex-sprites/*.png`: confirmed final sprites are 512x512 RGBA PNGs.
- Visual inspection contact sheet at `test-results/little-alex-qwen-sprites/assets-contact-sheet.png`: passed. Feminine has long hair, variants are visibly different, parts match within each sheet, and shoulders/clipboard/suit assets are present.

## Blockers

- Qwen initially ignored the strict grid for the neutral sheet and produced repeated full character poses. The prompt was tightened to an animation-rig paper-doll source sheet with explicit per-cell part constraints.
- Qwen put light paper panels behind the feminine parts. The cropper now removes edge-connected green and light-paper background while preserving enclosed white shirt pixels.
