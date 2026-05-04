# Task

Fix the T03 code-quality finding for auth throttle failed-login counting.

## Scope

- Make `recordFailedLoginAttempt` increment failed-login counts atomically at the persistence layer.
- Preserve the existing auth throttle repository API shape for T04 auth integration.
- Derive `throttledUntil` from the persisted failed-attempt count after the atomic increment.
- Add repository integration coverage for repeated and concurrent failed-login attempts.
- Do not touch `src/server/auth/**`, UI files, Prisma schema, or migrations.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test -- --run src/server/repositories`
- `git diff --check`
- `git status --short` before and after commit
