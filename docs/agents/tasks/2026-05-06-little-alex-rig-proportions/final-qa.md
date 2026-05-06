# Final QA

## 2026-05-06 QA Branch

- `npx eslint e2e/little-alex-physics.spec.ts` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` ran in the QA worktree and produced the three presentation screenshots under `test-results/little-alex-qwen-sprites/`.
- The focused Playwright run currently fails only on the new rig proportion assertion because this isolated QA branch has not merged the proportion branch yet:
  - `neutral: head/torso vertical gap 8.0 is outside -2..4`
  - `masculine: head/torso vertical gap 8.0 is outside -2..4`
  - `feminine: head/torso vertical gap 8.0 is outside -2..4`

The first eight Little Alex e2e checks passed in that run, covering global visibility, drag/fling, desktop sidebar bounds, saved preferences and bubble text, idle transition, mobile viewport bounds, mobile nav taps, and reduced-motion draggable-safe mode.
