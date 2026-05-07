# Responsibilities

## Branch Manager C

- Own `codex/ai-draft-reliability` in `/Users/vishal/Developer/Fairplay/.worktrees/ai-draft-reliability`.
- Investigate AI card draft generation failures with systematic debugging before changing code.
- Add regression tests before production fixes.
- Fix backend/provider configuration paths for AI draft Save, Retry, Regenerate, and Put in play only when the root cause is backend/API.
- Preserve safe diagnostics: no prompts, raw audio, API keys, or raw provider response bodies in logs or docs.
- Document failure source, architectural cause, fix, validation, blockers, and merge risks.

## Out Of Scope

- Frontend learner-practice files and unrelated UX changes.
- Live provider calls with real keys.
- Changes outside the assigned worktree.
