# Task 7: Crash Course Content Flow

## Expectations

- Build only the crash-course content and flow slice for the personal-use redesign.
- Keep edits inside `src/components/crash-course/**`, `src/app/app/crash-course/page.tsx`, and this report.
- Use TDD: write failing tests first, verify RED, implement, then verify GREEN.
- Include the ten approved lesson titles, progress/skip/finish behavior, and an interactive minimum-standard rewrite prompt in lesson 4.

## Outputs

- Created `src/components/crash-course/crash-course-flow.test.tsx`.
- Created `src/components/crash-course/crash-course-content.ts`.
- Created `src/components/crash-course/crash-course-flow.tsx`.
- Created `src/app/app/crash-course/page.tsx`.
- Created `docs/implementation/2026-05-04-task-07-crash-course-content-flow.md`.
- Tests run:
  - `npm test -- src/components/crash-course/crash-course-flow.test.tsx` failed RED because `./crash-course-content` did not exist.
  - `npm test -- src/components/crash-course/crash-course-flow.test.tsx` passed GREEN with 4 tests.
  - `npm run typecheck` failed on existing out-of-scope seed work: `src/seed/fairplay-source-cards.test.ts` imports missing `./fairplay-source-cards` and has implicit `any` parameters.
- Commits created: none yet.

## Challenges

- Persistence APIs for crash-course progress and dismissal are not ready in this worker's ownership scope, so `/app/app/crash-course/page.tsx` uses temporary browser-session React state callbacks only.
- The worktree contains unrelated changes from other workers, including app shell, domain, UI, contracts, and seed files. They were not modified or reverted.
- Full typecheck cannot pass until the separate seed/data slice provides `src/seed/fairplay-source-cards.ts` or updates its test.

## Next Handoff

- Persistence/settings workers should replace the route's temporary `useState` callbacks with persona-scoped server-backed onboarding preferences.
- Settings can later restart this flow by routing to `/app/crash-course` with a persisted progress reset.
- The content intentionally paraphrases the research reports and avoids long copied source passages.
