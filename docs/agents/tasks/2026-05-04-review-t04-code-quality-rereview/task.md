# T04 Code Quality Re-Review Task

## Role

CODE QUALITY re-reviewer for implementation task T04 on `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`.

## Review Target

- Prior code-quality findings in `docs/agents/tasks/2026-05-04-review-t04-code-quality/handoff.md`.
- Auth hardening fix commit `574ff8aeac437196c8f0944c420cfd34261dc792`.

## Scope

Re-review T04 auth/session/persona API quality after the auth hardening fix. Do not modify production code.

## Checklist

- Confirm missing username login path performs dummy Argon2 verification or equivalent constant-work mitigation and preserves generic errors.
- Confirm malformed/corrupt stored hash verification returns `false` and generic auth failure, not a `500`.
- Confirm `setSessionCookie` max-age handles future, immediate, past, and invalid expiration safely and does not mint a default active cookie for expired values.
- Quick sweep for regressions:
  - secure cookies,
  - raw token only in cookie,
  - no sensitive browser storage,
  - route handler consistency,
  - meaningful tests.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`
- `npm test -- --run src/middleware.test.ts`
- `npm run build`

## Constraints

- Create review artifacts in `docs/agents/tasks/2026-05-04-review-t04-code-quality-rereview/`.
- Update `docs/agents/manifest.md` and `docs/agents/controller-log.md`.
- Commit review artifacts with message `docs: add T04 code quality rereview`.
- Push `codex/v1-app`.
