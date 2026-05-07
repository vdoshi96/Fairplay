# Blockers

## Current

- None.

## Watch Items

- Worktree-local env hydration can still omit required variables. The code now limits failures to the operation that actually needs the missing env.
- Live providers can still rate-limit or return billing errors. This branch verifies local behavior with mocks and preserves safe failure output for provider failures.
- Merge conflicts are possible if another branch edits provider config, AI draft route helpers, README env wording, or `.env.example`.
