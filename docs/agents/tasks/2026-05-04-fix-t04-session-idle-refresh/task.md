# Task

Fix the T04 spec-review finding that authenticated session activity validates `lastSeenAt` but does not refresh it.

## Scope

- Worktree: `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`
- Branch: `codex/v1-app`
- Owned code: `src/server/auth/current-session.ts`, related tests, and `src/server/repositories/sessions.ts` if needed.
- Preserve revocation checks, seven-day idle expiration from `lastSeenAt`, and 30-day absolute expiration from `createdAt`.
- Do not refresh revoked, idle-expired, or absolute-expired sessions.
- Do not extend absolute expiration or persist raw session tokens.

## Required Verification

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`
- `npm test -- --run src/middleware.test.ts`
- `npm run build`
- `git diff --check`
- `git status --short` before and after commit

