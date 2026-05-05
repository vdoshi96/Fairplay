# Task 4: Login Splash Illustration

## Expectations

Add an original animated login splash that follows Option A plus nature: a practical login form on the left, a warm household garden scene on the right for desktop, and a stacked mobile layout. Keep auth shell reuse intact for create household and persona flows.

## Outputs

- Created `LoginSplashIllustration` with an accessible `role="img"` label, no visible text in the illustration, and visible Alex, Max, helper spark, cloud, plants, and household board elements.
- Updated `AuthPageShell` with an optional `visual` slot that widens only when a visual is provided.
- Wired the login page to the splash and adjusted summary copy toward calmer household rhythm.
- Added cloud drift and leaf sway motion classes with reduced-motion coverage.

## Verification

- Red: `npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx` failed because the splash component did not exist and the login page had no accessible splash image.
- Green: `npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx` passed with 2 test files and 7 tests passing.

## Challenges

Local dependencies were initially absent. `npx` attempted to install Vitest ad hoc and could not resolve the repository config; `npm ci` also hit a lifecycle script issue once, so dependencies were installed from the lockfile with scripts disabled for the focused React test run.
