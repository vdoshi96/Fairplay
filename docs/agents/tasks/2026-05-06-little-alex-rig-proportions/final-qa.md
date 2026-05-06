# Final QA

## 2026-05-06 QA Branch

- `npx eslint e2e/little-alex-physics.spec.ts` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` ran in the QA worktree and produced the three presentation screenshots under `test-results/little-alex-qwen-sprites/`.
- The focused Playwright run currently fails only on the new rig proportion assertion because this isolated QA branch has not merged the proportion branch yet:
  - `neutral: head/torso vertical gap 8.0 is outside -2..4`
  - `masculine: head/torso vertical gap 8.0 is outside -2..4`
  - `feminine: head/torso vertical gap 8.0 is outside -2..4`

The first eight Little Alex e2e checks passed in that run, covering global visibility, drag/fling, desktop sidebar bounds, saved preferences and bubble text, idle transition, mobile viewport bounds, mobile nav taps, and reduced-motion draggable-safe mode.

## 2026-05-06 Pixel QA Branch

- `npm run test:e2e -- little-alex-pixel-qa.spec.ts` passed with one coherent synthetic fixture and one detached duplicate-clipboard fixture.
- `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"` passed after adding rendered-pixel recognition to the existing screenshot flow.
- `npm run test:e2e -- little-alex-physics.spec.ts` passed all 9 Little Alex tests with the pixel QA enabled.
- `npm run typecheck` passed.
- `npm run lint -- e2e/little-alex-physics.spec.ts e2e/little-alex-pixel-qa.spec.ts e2e/helpers/little-alex-pixel-qa.ts` passed.
