# T05 Code Quality Review

## Assignment

Review implementation task T05 at commit `c93da78` for frontend quality, accessibility, state handling, responsive design, API interaction, and test quality.

## Scope

- Reviewed T05 production changes under `src/app`, `src/components`, and T05 tests under `e2e` and `src/components`.
- Ignored prior review/task artifact commits except as context.
- Did not modify production code.

## Outcome

CHANGES_REQUESTED

## Findings

1. `[P2]` Persona-switch confirmation is not keyboard-modal.
   - File: `src/components/settings/settings-panel.tsx:113`
   - The switch confirmation uses `role="dialog"` and `aria-modal="true"`, but opening it leaves focus on the underlying `Switch persona` trigger, does not trap focus inside the dialog, does not restore focus on close, and does not support Escape dismissal. Because the dialog is appended after the page controls, keyboard users can tab to the obscured `Log out` button before reaching `Continue` or `Cancel`. This breaks modal accessibility and makes the confirmation less robust than the visual UI suggests.

2. `[P3]` Mocked e2e coverage replaces protected app UI with fixture HTML.
   - File: `e2e/auth-onboarding.spec.ts:86`
   - `mockProtectedDocuments` fulfills `/app/onboarding` and `/app/home` with handcrafted HTML, so the create/login/persona flows do not exercise the real `AppShell`, `OnboardingGuide`, home content, protected layout redirects, mobile nav, or focus behavior after persona selection. This is acceptable as a DB-unavailable limitation only if paired with real component/page coverage for those surfaces; currently the e2e can pass while protected-page UI regressions remain hidden.

## Required Fixes

- Owner: T05 frontend worker.
- Fix `SettingsPanel` dialog focus handling using a native `<dialog>` or an accessible modal pattern: move focus into the dialog on open, keep Tab/Shift+Tab inside while open, restore focus to the trigger on close, support Escape/Cancel, and prevent background controls from being reachable while `aria-modal` is true.
- Add or adjust tests to cover the dialog keyboard path and to ensure protected app UI is exercised by real components/pages rather than only handcrafted Playwright HTML fixtures.

## Verification

- `git status --short`: clean before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/components/auth src/components/onboarding`: passed, 2 files and 7 tests.
- `npm run test:e2e -- --grep "auth|onboarding"`: passed, 4 tests with route mocks.
- `npm run build`: passed, with the existing non-blocking Next.js edge-runtime static-generation warning.
