# Task

Focused T08 spec-review fix worker for guided check-ins.

## Scope

- Fix item mutation scoping so updates require the active session household check-in and the nested item id to match.
- Split agenda preview from active check-in creation/resume.
- Add structured guided responsibility decision controls for owner and review date, with a real responsibility effect payload.
- Preserve neutral check-in language for skip/defer and summaries.

## Constraints

- Work on `codex/v1-app` in `.worktrees/v1-app`.
- Do not revert edits made by other workers.
- Stay within check-in service/API/component/e2e surfaces and task docs.
- Do not touch private References files.

## Verification Targets

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`
- `npm run test:e2e -- --grep "check-in"`
- `npm run build`
- `git diff --check`
