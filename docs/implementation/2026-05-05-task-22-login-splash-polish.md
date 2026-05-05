# Task 22: Login Splash Polish

## Expectations

- Replace the thin login splash art with a richer warm household and garden illustration.
- Preserve the accessible image label: `Animated Fairplay household garden scene`.
- Add stable test ids for richer scene elements, including garden path, character group, and floating cards.
- Keep subtle animation hooks covered by reduced-motion CSS.
- Use TDD with focused auth tests before implementation.

## Outputs

- Rebuilt `LoginSplashIllustration` as a layered warm scene with sky, house, garden path, nature shapes, large Alex/Max characters, task cards, and household board artifacts.
- Added stable scene test ids: `login-splash-sky-layer`, `login-splash-nature-layers`, `login-splash-house`, `login-splash-garden-path`, `login-splash-character-group`, `login-splash-floating-cards`, and task-card ids.
- Added focused tests for the richer illustration and login page integration.
- Added `fp-motion-character-breathe` and `fp-motion-card-float` keyframes/classes, and included both in the reduced-motion override.

## Verification

- Red: `npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx`
  - Failed as expected because `login-splash-sky-layer` and `login-splash-garden-path` were missing.
- Green: `npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx`
  - Passed: 2 test files, 8 tests.
- Lint: `npx eslint src/components/auth/login-splash-illustration.tsx src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx`
  - Passed with no reported issues.

## Challenges

- The repo ESLint config targets TypeScript/Next files, so `src/app/globals.css` and this Markdown report were not directly linted by ESLint.
- Visual polish was verified through focused DOM tests and lint only; no browser screenshot pass was requested for this worker slice.
