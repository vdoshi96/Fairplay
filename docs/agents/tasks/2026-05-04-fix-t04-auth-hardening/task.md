# Task

Fix the T04 code-quality auth hardening findings from `docs/agents/tasks/2026-05-04-review-t04-code-quality/handoff.md`.

## Scope

- Worktree: `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`
- Branch: `codex/v1-app`
- Owned code: auth password helpers, session cookie helpers, login route, related auth API tests, and task/controller docs.
- Do not touch auth UI, unrelated feature logic, Prisma schema/migrations, or private reference files.

## Findings To Fix

1. Missing usernames or missing credentials skip Argon2 verification, creating a timing side channel.
2. Malformed or unsupported stored password hashes escape `verifyPassword` as route-level 500s.
3. `setSessionCookie` treats computed `0` or `NaN` max ages as a default active cookie lifetime.

## Required Verification

- `git status --short` before and after commit
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`
- `npm test -- --run src/middleware.test.ts`
- `npm run build`
- `git diff --check`

