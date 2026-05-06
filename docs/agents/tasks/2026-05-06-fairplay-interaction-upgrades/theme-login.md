# Theme/Login Workstream

## Responsibilities

- Branch/worktree: `codex/fairplay-theme-login` in `/Users/vishal/Developer/Fairplay/.worktrees/fairplay-theme-login`.
- Own Task 1 from `docs/superpowers/plans/2026-05-06-fairplay-interaction-upgrades.md`.
- Add System / Light / Dark appearance mode with system default, local persistence, and root theme attributes.
- Add Settings appearance controls using existing UI style.
- Add dark CSS tokens without broad rewrites to other workstream-owned surfaces.
- Add regression coverage for Enter-submit from logged-out username and password fields.
- Avoid document-level login key handlers.

## Implementation Notes

- Added `src/components/theme/theme-provider.tsx` and `src/components/theme/theme-constants.ts`.
- Theme mode uses localStorage key `fairplay:theme-mode`.
- Root attributes:
  - `data-theme="light" | "dark"`
  - `data-theme-mode="system" | "light" | "dark"`
- System mode follows `window.matchMedia("(prefers-color-scheme: dark)")` and updates on media query changes.
- `src/app/layout.tsx` now runs an inline no-flash script before the app tree and wraps the app in `ThemeProvider`.
- `src/app/globals.css` now includes `html[data-theme="dark"]` tokens and color-scheme support.
- Settings includes an Appearance section backed by the existing `SegmentedControl`.
- Login Enter handling is input-scoped only. It calls `event.currentTarget.form?.requestSubmit()` and does not add any document-level handler.
- Added Playwright coverage for Enter in both login fields, in addition to component coverage.

## Subagent / Review Notes

- Subagent tooling was unavailable in this session. `tool_search` for subagent/review tooling exposed unrelated app tools only, and no callable Task/subagent tool was present.
- Fallback performed:
  - Full diff review.
  - `git diff --check`.
  - Search for document/window login key handlers.
  - Spec checklist against Task 1 acceptance criteria.
- Review search result for key handlers:

```text
$ rg -n "document\\.addEventListener\\([^)]+key|window\\.addEventListener\\([^)]+key|addEventListener\\([^)]+keydown|onkeydown|onkeyup|onkeypress" src e2e
src/components/guide/guided-tour.tsx:48:    document.addEventListener("keydown", handleKeyDown);
```

This existing listener belongs to the guided tour escape/keyboard handling, not login.

## Blockers / Risks

- Active blockers: none.
- Playwright emits existing environment warnings about `FORCE_COLOR` and multiple lockfiles/worktree root inference. Tests still pass.
- Dark tokens are app-wide, but many older feature surfaces still contain hard-coded `bg-white` utilities. This branch normalized the Settings surface and root tokens; broader dark visual polish should stay scoped to follow-up visual QA or relevant workstreams.

## Achievements

- Confirmed TDD red for login Enter regression and missing theme provider/control behavior.
- Implemented persisted System / Light / Dark theme selection.
- Added no-flash root theme initialization.
- Added dark theme CSS tokens.
- Added Settings appearance controls with current resolved system state copy.
- Added component and Playwright regressions for Enter-submit from logged-out username/password fields.
- Ran focused tests, lint, typecheck, full Vitest, and auth onboarding Playwright smoke successfully.

## QA Command Outputs

### TDD Red

```text
$ npm test -- src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx
> fairplay@0.1.0 test
> vitest src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx

RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-theme-login

src/components/auth/auth-forms.test.tsx (8 tests | 2 failed)
  auth forms > submits login when Enter is pressed in a logged-out username field
    expected "spy" to be called 1 times, but got 0 times
  auth forms > submits login when Enter is pressed in a logged-out password field
    expected "spy" to be called 1 times, but got 0 times

FAIL  src/components/settings/settings-panel.test.tsx
Error: Failed to resolve import "@/components/theme/theme-provider" from "src/components/settings/settings-panel.test.tsx". Does the file exist?

FAIL  src/components/theme/theme-provider.test.tsx
Error: Failed to resolve import "./theme-provider" from "src/components/theme/theme-provider.test.tsx". Does the file exist?

Test Files  3 failed (3)
Tests  2 failed | 6 passed (8)
```

### Focused Green

```text
$ npm test -- src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx src/components/app-shell/app-shell.test.tsx
> fairplay@0.1.0 test
> vitest src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx src/components/app-shell/app-shell.test.tsx

RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-theme-login

✓ src/components/theme/theme-provider.test.tsx (4 tests) 102ms
✓ src/components/auth/auth-forms.test.tsx (8 tests) 250ms
✓ src/components/app-shell/app-shell.test.tsx (5 tests) 356ms
✓ src/components/settings/settings-panel.test.tsx (10 tests) 512ms

Test Files  4 passed (4)
Tests  27 passed (27)
```

### Lint

```text
$ npm run lint
> fairplay@0.1.0 lint
> eslint .
```

### Typecheck

```text
$ npm run typecheck
> fairplay@0.1.0 typecheck
> tsc --noEmit
```

### Full Vitest

```text
$ npm test
> fairplay@0.1.0 test
> vitest

RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-theme-login

Test Files  89 passed (89)
Tests  435 passed (435)
Duration  17.32s
```

### Playwright Auth Smoke

```text
$ npm run test:e2e -- auth-onboarding.spec.ts
> fairplay@0.1.0 test:e2e
> playwright test auth-onboarding.spec.ts

[WebServer] Warning: Next.js inferred your workspace root, but it may not be correct.
[WebServer] We detected multiple lockfiles and selected the directory of /Users/vishal/Developer/Fairplay/package-lock.json as the root directory.
[WebServer] Detected additional lockfiles:
[WebServer]   * /Users/vishal/Developer/Fairplay/.worktrees/fairplay-theme-login/package-lock.json

Running 6 tests using 5 workers

✓ auth and onboarding > Enter in the login username field submits like the button
✓ auth and onboarding > Enter in the login password field submits like the button
✓ auth and onboarding > cleared cookie redirects app home to login
✓ auth and onboarding > logout -> login -> choose persona -> home
✓ auth and onboarding > keyboard smoke through login and persona screens
✓ auth and onboarding > create household -> choose persona -> onboarding -> home

6 passed (23.4s)
```

### Whitespace Check

```text
$ git diff --check
```
