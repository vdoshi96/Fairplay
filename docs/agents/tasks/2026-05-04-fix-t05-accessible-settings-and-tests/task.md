# Task

Fix the T05 frontend code-quality findings from `docs/agents/tasks/2026-05-04-review-t05-code-quality/handoff.md`.

## Scope

- Make the Settings persona-switch confirmation keyboard-modal and accessible.
- Add focused modal keyboard/focus tests.
- Improve coverage for real AppShell, onboarding, home, and settings UI without claiming DB-backed verification.
- Keep edits inside the T05 owned files and task documentation.

## Constraints

- Do not touch server auth/API internals, Prisma/repositories, responsibility/radar/check-in feature folders, or private reference files.
- Preserve mocked API honesty in docs and handoff notes.
- Work on `codex/v1-app`.

