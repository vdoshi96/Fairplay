# Final QA

## 2026-05-06 QA Branch

- `npx eslint e2e/little-alex-physics.spec.ts` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` ran in the QA worktree and produced the three presentation screenshots under `test-results/little-alex-qwen-sprites/`.
- The focused Playwright run failed as expected before the rig branch merged because each old presentation had an `8.0px` head/torso gap, outside the `-2..4px` target.

The first eight Little Alex e2e checks passed in that isolated run, covering global visibility, drag/fling, desktop sidebar bounds, saved preferences and bubble text, idle transition, mobile viewport bounds, mobile nav taps, and reduced-motion draggable-safe mode.

## 2026-05-06 Integrated Rig QA

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed on `main` with 22 tests.
- `npm run test:e2e -- little-alex-physics.spec.ts` initially failed after merging proportions, idle speed, and QA because the visual geometry assertion found only `6.0px` arm/torso shoulder overlap.
- `codex/little-alex-rig-asset-fit` fixed that wrapper-level issue by moving arm anchors inward and trimming transparent Qwen sprite padding.
- User visual review later found this was still not sufficient: the screenshots had visible limb gaps and duplicate clipboard artifacts. That invalidated wrapper geometry as a completion signal.

## 2026-05-06 Coherent Full-Body QA

- Generated original full-body Qwen assets for `neutral`, `masculine`, and `feminine`; no internet model or copied mannequin was used.
- Rendered the full-body assets as the visible Little Alex layer while retaining hidden Matter.js body parts for dragging, flinging, idle state, and bounds behavior.
- Added visible full-body viewport assertions so fling/bounds QA checks the character users actually see.
- Added pixel-recognition checks over actual image pixels:
  - near-connected silhouette,
  - exactly one large central tan clipboard region,
  - no large detached visible body gaps,
  - human-like full-body aspect ratio,
  - left/right leg height and area proportion thresholds.
- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` passed with 22 tests on `codex/little-alex-coherent-full-body`.
- `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"` passed on `codex/little-alex-coherent-full-body`.
- `npm run test:e2e -- little-alex-physics.spec.ts` passed with 9 tests on `codex/little-alex-coherent-full-body`.
- The screenshot-diff pixel QA branch also passed:
  - `npm run test:e2e -- little-alex-pixel-qa.spec.ts`,
  - `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"`,
  - `npm run test:e2e -- little-alex-physics.spec.ts`,
  - `npm run typecheck`,
  - `npm run lint -- e2e/little-alex-physics.spec.ts e2e/little-alex-pixel-qa.spec.ts e2e/helpers/little-alex-pixel-qa.ts`.
- Screenshot review of `neutral.png`, `masculine.png`, and `feminine.png` showed one connected body, one clipboard, matched limb proportions, black suit/white shirt, and long hair for the feminine variant.
