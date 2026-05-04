# Task T04 Spec Compliance Re-review

## Assignment

Re-review T04 auth/session/persona APIs after idle-refresh fix commit `aae2b9ee6c708409ec4be9f66e51b7a0147d9fd5`.

## Review Target

- Original T04 commit: `1a795c87404a3ead864809af58408c0d5af39e74`
- T04 idle-refresh fix commit: `aae2b9ee6c708409ec4be9f66e51b7a0147d9fd5`
- Prior review handoff: `docs/agents/tasks/2026-05-04-review-t04-spec/handoff.md`

## Checklist

- Confirm active authenticated lookup refreshes `lastSeenAt`.
- Confirm idle-expired, absolute-expired, and revoked sessions are not refreshed or accepted.
- Confirm absolute expiration is not extended.
- Sweep original T04 requirements: Argon2id params/hash metadata, cookie flags, raw token not stored, generic login errors, throttle defaults/reset, persona selection household scoping, logout clears/revokes, `/api/auth/me` returns no sensitive fields, middleware redirects, and no browser sensitive storage.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`
- `npm test -- --run src/middleware.test.ts`
- `npm run build`
