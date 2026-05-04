# Task

Fix the T06 spec-review findings from `docs/agents/tasks/2026-05-04-review-t06-spec/handoff.md`.

## Scope

- Align responsibility edit saves with the strict general update schema.
- Add relevant-days and non-private visibility controls to the editor.
- Add a dedicated responsibility visibility mutation path.
- Back load-map radar filtering with linked radar item data.
- Display area mix and hidden-effort mix summary signals from the load snapshot.
- Add focused unit, route, component, and route-mocked e2e coverage.

## Constraints

- Work in `/Users/vishal/Developer/Fairplay/.worktrees/v1-app` on `codex/v1-app`.
- Do not revert edits from other workers.
- Keep repository changes tiny and scoped to data already needed by the T06 UI.
- Do not touch auth internals, radar UI pages, check-in files, seed content, or private `References/` files.
- Preserve neutral, non-comparative product language.
