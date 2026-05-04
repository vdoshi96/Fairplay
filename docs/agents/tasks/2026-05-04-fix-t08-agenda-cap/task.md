# Task

Focused T08 spec rereview fix worker for guided check-in agenda caps.

## Scope

- Fix the T08 rereview finding that externally supplied `maxItems` values above five can produce more than five agenda items.
- Keep the default agenda size capped at five.
- Add regression coverage for service and route paths.

## Constraints

- Work on `codex/v1-app` in `.worktrees/v1-app`.
- Do not revert edits made by other workers.
- Touch only owned check-in agenda/API files, tests, and task docs/logs.

## Verification Targets

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/check-ins src/app/api/check-ins`
- `npm run build`
- `git diff --check`
