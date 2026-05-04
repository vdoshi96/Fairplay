# Handoff

## Status

APPROVED

## Findings

- None.

## Prior Finding Resolution

- Resolved: `src/app/api/auth/login/route.ts:50` now chooses either the stored credential hash or `MISSING_CREDENTIAL_PASSWORD_HASH`, then calls `verifyPassword` at `src/app/api/auth/login/route.ts:53` for all non-throttled login attempts. Absent usernames and wrong passwords still return the same generic `401` body.
- Resolved: `src/server/auth/passwords.ts:44` wraps Argon2 verification in a `try`/`catch` and returns `false` on malformed or corrupt stored hashes, allowing routes to respond with generic auth failure instead of `500`.
- Resolved: `src/server/auth/cookies.ts:21` rejects invalid expiration inputs, and `src/server/auth/cookies.ts:25` computes `Max-Age` directly with a floor of `0`, so immediate or past expirations do not become default active cookies.

## Test Coverage Confirmation

- Missing username verifier path: `src/app/api/auth/login/route.test.ts:132` verifies `verifyPassword` is called with `MISSING_CREDENTIAL_PASSWORD_HASH` and returns the generic `401`.
- Malformed stored hash route behavior: `src/app/api/auth/login/route.test.ts:149` verifies a corrupt hash returns the generic `401`.
- Malformed stored hash helper behavior: `src/server/auth/passwords.test.ts:38` verifies `verifyPassword` resolves to `false`.
- Cookie expiration edge cases: `src/server/auth/cookies.test.ts:7`, `src/server/auth/cookies.test.ts:20`, `src/server/auth/cookies.test.ts:33`, and `src/server/auth/cookies.test.ts:46` cover future, immediate, past, and invalid expirations.

## Regression Sweep

- Cookie helpers remain `httpOnly`, production-only `secure`, `sameSite: "lax"`, and path `/`.
- Session-token posture remains sound at static-review level: raw tokens are generated from 32 random bytes, persisted as HMAC token hashes, and exposed only to route handlers for cookie setting.
- No `localStorage` or `sessionStorage` usage was found in `src/`.
- Auth/persona route handlers remain consistent with node runtime declarations for server auth/repository work.
- Persona selection remains household-scoped through the session household boundary.

## Verification

- `git status --short`: passed; clean before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`: passed; 9 files and 22 tests.
- `npm test -- --run src/middleware.test.ts`: passed; 1 file and 3 tests.
- `npm run build`: passed with the existing edge-runtime static-generation warning.

## Owner

No implementation owner action required for this code-quality re-review.
