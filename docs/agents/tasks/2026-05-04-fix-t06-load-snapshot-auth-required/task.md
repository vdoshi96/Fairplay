# T06 Load Snapshot Auth Required Fix

## Task

Fix the T06 code-quality rereview finding where `/api/load-snapshot` did not translate `AUTH_REQUIRED` from `responsibilityService.listOverview`.

## Scope

- Keep changes focused on the load-snapshot route and route coverage.
- Match `/api/responsibilities` 401-style behavior.
- Preserve signed-out and selected-persona behavior.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/app/api/load-snapshot src/app/api/responsibilities src/server/responsibilities`
- `npm run build`
- `git diff --check`
