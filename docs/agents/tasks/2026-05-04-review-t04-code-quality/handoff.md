# Handoff

## Status

CHANGES_REQUESTED

## Findings

1. `src/app/api/auth/login/route.ts:47` - Missing users skip Argon2 verification, creating a username-enumeration timing side channel. Existing households with a wrong password run the expensive Argon2 verify at lines 47-50, while absent households return after the lookup and failure-recording path. The response body is generic, but the timing difference is externally measurable and weakens the household username boundary.
2. `src/server/auth/passwords.ts:41` - `verifyPassword` lets Argon2 parsing/verification errors escape. A malformed, unsupported, or corrupted stored password hash would bubble to the route as a 500 instead of being handled as a generic authentication failure. That is not a safe auth-wrapper failure mode and is currently untested.
3. `src/server/auth/cookies.ts:30` - `setSessionCookie` turns expired or invalid expirations into a fresh default session cookie because `maxAge || SESSION_ABSOLUTE_EXPIRATION_MS` treats `0` and `NaN` as "use 30 days." A caller that passes an immediate/past/invalid expiration should not mint an active cookie.

## Required Fixes

1. T04 auth owner: add a constant-work missing-user path for login. Use a maintained dummy Argon2id hash matching the current password metadata, verify against it when the household/credential is missing, preserve the same generic error, and add timing-path/unit coverage that proves the verifier is invoked for absent usernames.
2. T04 auth owner: wrap password verification errors safely. Treat malformed or unsupported hashes as `false` for auth decisions, optionally log server-side without secrets, and add a focused malformed-hash regression test plus route coverage that returns the generic 401 instead of throwing.
3. T04 auth owner: fix `setSessionCookie` to use the computed `maxAge` directly or reject invalid expiration input. Add cookie helper or route-level tests for future, immediate, past, and invalid expirations, and keep `clearSessionCookie` behavior unchanged.

## Verification

- `git status --short`: passed; clean before review.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`: passed; 8 files and 15 tests.
- `npm test -- --run src/middleware.test.ts`: passed; 1 file and 3 tests.
- `npm run build`: passed; Next.js build completed with the existing non-blocking edge-runtime static-generation warning.

## Notes

- Session-token generation and persistence posture looked sound at static-review level: 32 random bytes for the raw token, HMAC-SHA256 token hashes, and raw-token exposure limited to cookie setting.
- Current-session idle refresh is clear after the focused fix and does not refresh revoked, idle-expired, absolute-expired, missing, or unknown sessions.
- Throttle repository usage benefits from the prior atomic persistence fix and keeps generic login errors.
- Persona selection is household-scoped at the repository boundary and has cross-household regression coverage.
- Middleware matching is limited to `/app/:path*`; API and static assets are not broadly redirected.
- No sensitive `localStorage` or `sessionStorage` usage was found in `src/`.
- The review did not modify production code.
