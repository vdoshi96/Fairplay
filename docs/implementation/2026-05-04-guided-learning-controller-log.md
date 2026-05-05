# Controller Build Log: Guided Learning and Login Splash

## Expectations

- Execute the approved guided learning and login splash spec.
- Use heavy subagent-driven work with disjoint file ownership.
- Keep all worker outputs reviewable through implementation reports.
- Preserve unrelated user or worker edits.
- Commit, push, PR, wait for Vercel, merge, and align local `main` with GitHub at the end.

## Outputs

- Spec: `docs/superpowers/specs/2026-05-04-guided-learning-and-login-splash.md`.
- Plan: `docs/superpowers/plans/2026-05-04-guided-learning-and-login-splash-implementation.md`.
- Branch: `codex/guided-learning-splash`.
- Task 11 guide foundation committed in `3b11dc3`.
- Task 14 animated login splash committed in `0066406`.
- Task 15 crash-course character scenes committed in `2448243`.
- Task 12 learning hub, persistent welcome, and settings entry points committed in `a281fbb`.
- Task 13 feature tour launchers and markers committed in `dbc8390`.
- Task 16 e2e/integration verification added with a real guided-learning browser flow and a preference initialization race fix.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx vitest run` passed with 72 files and 273 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build` passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e` passed with 11 Playwright tests.

## Challenges

- Workers touched disjoint areas successfully; the controller kept commits separated by task.
- Browser verification exposed a real onboarding-preferences initialization race when protected layout and guide-related requests initialized the same persona preferences concurrently. `getOnboardingPreferences` now recovers from the unique constraint by returning the row created by the competing request.
- The new real-app Playwright test waits for persona selection to be observable through `/api/auth/me` before entering protected routes.
