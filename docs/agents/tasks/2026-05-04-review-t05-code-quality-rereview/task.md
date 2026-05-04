# T05 Code Quality Re-Review Task

## Role

CODE QUALITY re-reviewer for implementation task T05 on `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`.

## Review Target

- Prior code-quality findings in `docs/agents/tasks/2026-05-04-review-t05-code-quality/handoff.md`.
- Accessible settings and protected UI test fix commit `237fc7b20b24940c1740b1e034da2572e4880de9`.

## Scope

Re-review T05 auth, onboarding, app shell, home, and settings UI quality after the focused accessibility and test-coverage fix. Do not modify production code.

## Checklist

- Confirm persona switch confirmation is keyboard-modal:
  - focus moves into dialog,
  - background controls are unreachable,
  - Escape and Cancel are supported,
  - focus is restored,
  - accessible name and description are present.
- Confirm tests cover modal keyboard, cancel, confirm, and focus behavior.
- Confirm real AppShell, home, onboarding, and settings UI are covered by component/page tests enough to compensate for mocked DB e2e.
- Quick sweep for:
  - no sensitive `localStorage` or `sessionStorage`,
  - good form state,
  - accessible labels, errors, and nav,
  - mobile layout risks.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/components/auth src/components/onboarding src/components/settings src/components/app-shell`
- `npm run test:e2e -- --grep "auth|onboarding"`
- `npm run build`

## Constraints

- Create review artifacts in `docs/agents/tasks/2026-05-04-review-t05-code-quality-rereview/`.
- Update `docs/agents/manifest.md` and `docs/agents/controller-log.md`.
- Commit review artifacts with message `docs: add T05 code quality rereview`.
- Push `codex/v1-app`.
