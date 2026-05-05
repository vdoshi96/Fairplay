# Task 16: Guided Learning Integration Verification

## Expectations

- Verify the combined guide foundation, learning hub, feature tours, crash-course scenes, login splash, and persistent welcome behavior after all worker slices landed.
- Add browser coverage for the practical guided-learning flow.
- Keep local verification evidence clear enough for review before PR and merge.

## Outputs

- Added `e2e/guided-learning.spec.ts`, a real-app Playwright flow that creates a household, selects a persona, verifies persistent welcome behavior, opens the Library guide from the Home learning hub, confirms backdrop locking and Skip/Back/Next controls, verifies manual guide launch, dismisses the welcome persistently, and checks crash-course character scenes.
- Extended `e2e/auth-onboarding.spec.ts` to verify the animated login splash on login and redirect flows.
- Added a regression test for concurrent onboarding preference initialization.
- Hardened `getOnboardingPreferences` so simultaneous first reads return the existing row when Prisma reports the persona preference unique constraint.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx vitest run` passed with 72 files and 273 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build` passed.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e` passed with 11 Playwright tests.

## Challenges

- The first real guided-learning browser run exposed a race in preference initialization. The root cause was two requests initializing the same persona preferences at the same time; the repository now treats the unique conflict as a signal to return the row created by the competing request.
- Next.js Dev Tools exposes a button whose accessible name contains `Next`, so the Playwright guide navigation uses dialog-scoped locators for `Next`, `Back`, and `Skip`.
