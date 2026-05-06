# Blockers

- Initial independent body-part generation risked mismatched parts. Resolved by generating one source sheet per presentation and cropping all six parts from that sheet.
- Qwen initially produced repeated neutral full-body poses and light paper panels behind feminine cells. Resolved with stricter paper-doll prompts and edge-connected background removal.
- The isolated `codex/little-alex-sprite-qa` branch does not include the sprite renderer or PNG assets yet. `npm run test:e2e -- little-alex-physics.spec.ts` therefore fails only in the new visual QA test while waiting for `/assets/fairplay/little-alex-sprites/neutral-{head,torso,leftArm,rightArm,leftLeg,rightLeg}.png` to render as loaded images.
- No visual screenshots were produced in `test-results/little-alex-qwen-sprites/` on this isolated branch because the neutral sprite loading assertion fails before screenshot capture. Re-run after merging the asset and renderer branches.
- Playwright/Next emitted the existing worktree-root warning about multiple lockfiles and inferred `/Users/vishal/Developer/Fairplay/package-lock.json` as the workspace root. The test file itself resolved from the QA worktree and listed 9 tests.
