# Generated UI Assets Outcomes

## Objective

Use cute flat 2D generated assets across non-card Fairplay UI surfaces while preserving existing source-card PDF/reference assets.

## Task Status

- [x] Created isolated branch/worktree.
- [x] Recorded design and implementation plan.
- [x] Dispatched subagents for visual inventory, generation prompt design, and QA planning.
- [x] Added UI asset generation pipeline.
- [x] Generated 24 Qwen UI PNG assets plus a portable manifest.
- [x] Wired UI components to generated assets.
- [x] Ran full verification.
- [x] Completed browser QA.

## Subagent Outcomes

- Visual inventory identified shared visual components, login splash, crash course scenes, guide helper thumbnails, and the AI task manager sidekick as the main replacement surfaces.
- Generation prompt review recommended a separate non-card Qwen generator because the existing visible-asset script is card-cover-specific and enforces exact `5:7`.
- QA review recommended path/asset integrity tests, focused component tests, browser checks, and keeping tests independent from internal SVG/CSS drawing details.
- Final QA follow-up found the crash-course completion artwork had not been wired; fixed by using `crash-course/completion-celebration.png` in the completed-course splash.

## Resolved Blockers And Watch Items

- Qwen generation hit HTTP 429 after three rapid image requests. Added retry/backoff and `--skip-existing` resume support to the UI asset generator.
- The first retry run exposed a script ordering bug in the retry helper. Fixed by moving the provider error class above top-level generation.
- Worktree-local `vercel env run` did not expose `QWEN_IMAGE_*`; root checkout Vercel context does. Generation is run from the root Vercel context while writing into this worktree.
- AI Gateway `gpt-image-1-mini` remains blocked by Vercel 403 billing requirement and is not part of this branch.
- A parallel build/E2E attempt corrupted `.next`; cleared the generated `.next` cache and reran build and E2E sequentially.

## Verification Log

- `npm run assets:generate-ui -- --skip-existing`: passed; refreshed manifest with repo-relative paths and skipped provider setup when all assets already existed.
- `npm run test -- src/server/ai/generated-ui-assets.test.ts src/server/ai/generated-ui-asset-files.test.ts`: 2 files, 4 tests passed.
- `npm run test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-page-client.test.tsx src/components/crash-course/crash-course-scene.test.tsx`: 3 files, 20 tests passed after wiring completion art.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: 90 files, 433 tests passed.
- `npm run build`: passed. Warning remains for nested worktree lockfile root inference.
- `npm run test:e2e`: 11 Playwright tests passed.
