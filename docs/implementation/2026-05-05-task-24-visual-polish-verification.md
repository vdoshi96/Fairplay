# Task 24: Controller Integration and Verification

## Expectations

- Review and integrate the three subagent-owned polish slices.
- Keep every worker report in `docs/implementation` for later review.
- Verify the combined app through lint, typecheck, unit/integration tests, production build, and Playwright.
- Prepare the branch for GitHub PR and merge once checks are clean.

## Outputs

- Reviewed and committed Task 21, Task 22, and Task 23 outputs on `codex/visual-polish-learning`.
- Added an immersive app-shell layout mode for `/app/crash-course` during controller review so the crash-course art owns the full app canvas.
- Removed the old crash-course route header and changed saved-progress messages into floating overlays above the immersive stage.
- Preserved the subagent documentation files:
  - `docs/implementation/2026-05-05-task-21-crash-course-immersive.md`
  - `docs/implementation/2026-05-05-task-22-login-splash-polish.md`
  - `docs/implementation/2026-05-05-task-23-learning-copy-guide-helpers.md`

## Verification

- Focused crash-course/shell check: `npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx src/components/app-shell/app-shell.test.tsx`
  - Passed: 3 files, 23 tests.
- Focused route-shell lint: `npx eslint src/app/app/crash-course/page.tsx src/components/app-shell/app-shell.tsx src/components/app-shell/app-shell.test.tsx src/components/crash-course/crash-course-flow.tsx src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-scene.tsx src/components/crash-course/crash-course-scene.test.tsx`
  - Passed with no output.
- Full lint: `npm run lint`
  - Passed with no output.
- Full typecheck: `npm run typecheck`
  - Passed after fixing a single crash-course `Card` coordinate type mismatch.
- Full Vitest: `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx vitest run`
  - Passed: 73 files, 288 tests.
- Production build: `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build`
  - Passed; Prisma generated successfully and Next.js compiled the production app.
- Playwright: `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e`
  - Passed: 11 tests.

## Challenges

- Worker A intentionally stayed inside its owned crash-course component files, so the controller added the app-shell/page wrapper polish needed for a true full-canvas route.
- Typecheck found one string coordinate passed to a numeric helper prop. The issue was isolated to a single call and amended into the crash-course commit before full verification.
