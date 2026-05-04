# Task

Focused T08 code-quality fix worker for guided check-in decision integrity and UI mutation errors.

## Scope

- Validate responsibility decision effects against the current agenda item relationship.
- Make check-in decision recording guard active/mutable/undecided items and avoid orphan decision summaries.
- Add visible accessible mutation errors and pending states to the guided check-in flow.

## Constraints

- Work on `codex/v1-app` in `.worktrees/v1-app`.
- Do not revert edits made by other workers.
- Touch only owned T08 check-in service/API/component files, tests, and required task docs/logs.
- Preserve neutral language and avoid score-style copy.

## Verification Targets

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`
- `npm run test:e2e -- --grep "check-in"`
- `npm run build`
- `git diff --check`
