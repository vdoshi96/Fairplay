# Final QA

## 2026-05-06 QA Branch

- `npx eslint e2e/little-alex-physics.spec.ts` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` ran in the QA worktree and produced the three presentation screenshots under `test-results/little-alex-qwen-sprites/`.
- The focused Playwright run currently fails only on the new rig proportion assertion because this isolated QA branch has not merged the proportion branch yet:
  - `neutral: head/torso vertical gap 8.0 is outside -2..4`
  - `masculine: head/torso vertical gap 8.0 is outside -2..4`
  - `feminine: head/torso vertical gap 8.0 is outside -2..4`

The first eight Little Alex e2e checks passed in that run, covering global visibility, drag/fling, desktop sidebar bounds, saved preferences and bubble text, idle transition, mobile viewport bounds, mobile nav taps, and reduced-motion draggable-safe mode.

## 2026-05-06 Integrated Main QA

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed on `main` with 22 tests.
- `npm run test:e2e -- little-alex-physics.spec.ts` initially failed after merging proportions, idle speed, and QA because the new visual geometry assertion found `6.0px` arm/torso shoulder overlap.
- `codex/little-alex-rig-asset-fit` fixed that remaining issue by moving arm anchors inward and trimming transparent Qwen sprite padding.
- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed again on `main` with 22 tests after the asset-fit merge.
- `npm run test:e2e -- little-alex-physics.spec.ts` passed on `main` with 9 tests after the asset-fit merge.
- User visual review later found this was not sufficient: the screenshots still showed visible limb gaps and duplicate clipboard artifacts. This invalidated the wrapper-geometry QA as a completion signal.

## 2026-05-06 Coherent Full-Body QA

- Generated original full-body Qwen assets for `neutral`, `masculine`, and `feminine`; no internet model or copied mannequin was used.
- Rendered the full-body assets as the visible Little Alex layer while retaining hidden Matter.js body parts for dragging, flinging, idle state, and bounds behavior.
- Added pixel-recognition checks for the actual full-body image pixels:
  - near-connected silhouette,
  - exactly one large central tan clipboard region,
  - human-like full-body aspect ratio,
  - left/right leg height and area proportion thresholds.
- Added visible full-body viewport assertions so fling/bounds QA checks the character users actually see.
- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed with 22 tests on `codex/little-alex-coherent-full-body`.
- `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"` passed on `codex/little-alex-coherent-full-body`.
- `npm run test:e2e -- little-alex-physics.spec.ts` passed with 9 tests on `codex/little-alex-coherent-full-body`.
- Screenshot review of `neutral.png`, `masculine.png`, and `feminine.png` showed one connected body, one clipboard, matched limb proportions, black suit/white shirt, and long hair for the feminine variant.
