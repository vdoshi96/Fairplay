# Task

## Role

CODE QUALITY reviewer for implementation task T04 in `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`.

## Scope

Review T04 auth/session/persona API commits:

- `1a795c87404a3ead864809af58408c0d5af39e74`
- `aae2b9ee6c708409ec4be9f66e51b7a0147d9fd5`

Ignore review artifact commits except as context. Do not modify production code.

## Checklist

- Argon2id wrapper handles errors safely, parameter metadata is maintainable, and no obvious timing/security mistakes exist.
- Session token generation/hash uses strong randomness/hash; raw token exposure is limited to cookie response.
- Cookie helpers correctly serialize/clear and are production-safe.
- Current-session helper has clear control flow, avoids unexpected DB writes for unauthenticated paths, and handles revoked/expired sessions safely.
- Throttle service uses the atomic repository safely and preserves generic errors.
- API route handlers validate input, return consistent status/error shapes, avoid leaking sensitive values, and are testable.
- Persona selection cannot cross households.
- Middleware matching/redirects do not accidentally redirect APIs/static assets incorrectly.
- Tests cover high-risk behavior without brittle implementation coupling.
- No localStorage/sessionStorage sensitive data and no product-safety/IP regressions.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`
- `npm test -- --run src/middleware.test.ts`
- `npm run build`
