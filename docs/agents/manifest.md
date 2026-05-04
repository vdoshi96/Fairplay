# Agents Manifest

This manifest tracks agent work for the Fairplay repository.

## Active Tasks

| Date | Task | Owner | Status | Path |
| --- | --- | --- | --- | --- |
| 2026-05-04 | Workspace/repo setup | Codex setup agent | Completed locally; push pending | `docs/agents/tasks/2026-05-04-workspace-repo-setup/` |
| 2026-05-04 | Fair Play EPUB research | Codex research agent | Completed | `docs/agents/tasks/2026-05-04-fair-play-epub-research/` |
| 2026-05-04 | Better Share and idea research | Codex research agent | Completed | `docs/agents/tasks/2026-05-04-better-share-idea-research/` |
| 2026-05-04 | Trello data model research | Codex Trello/data-model research agent | Completed | `docs/agents/tasks/2026-05-04-trello-data-model-research/` |
| 2026-05-04 | Spreadsheet and PDF reference research | Codex spreadsheet/PDF research agent | Completed | `docs/agents/tasks/2026-05-04-spreadsheet-pdf-research/` |
| 2026-05-04 | IP, privacy, and relationship-safety review | Codex IP/privacy/safety agent | Completed | `docs/agents/tasks/2026-05-04-ip-privacy-safety-review/` |
| 2026-05-04 | Fairplay v1 product architecture | Codex product architecture agent | Completed | `docs/agents/tasks/2026-05-04-product-architecture/` |
| 2026-05-04 | Fairplay v1 gap review | Codex gap reviewer agent | Completed | `docs/agents/tasks/2026-05-04-gap-review/` |
| 2026-05-04 | Fairplay v1 task assignment | Codex task assignment agent | Completed | `docs/agents/tasks/2026-05-04-task-assignment/` |
| 2026-05-04 | Fairplay visual and asset direction | Codex visual/asset agent | Completed | `docs/agents/tasks/2026-05-04-visual-asset-direction/` |

## Rules

- Every agent task must create `task.md`, `work-log.md`, `learned.md`, `gaps.md`, and `handoff.md` in its task directory.
- Agents must preserve others' work and use non-destructive git commands.
- Private reference materials in `References/` are not committed unless explicitly cleared and already intentionally tracked.
- Research agents must keep private-reference output paraphrased and avoid copying source text, card descriptions, exercises, or assets into repo docs.
- Implementation agents must read `docs/product/ip-safety-review.md` before writing user-facing copy, seed data, templates, prompts, auth/session logic, or shared relationship-support flows.
- Visual implementation agents must read `docs/product/visual-system.md` and the latest visual-agent handoff before adding assets, motion, or character art.
