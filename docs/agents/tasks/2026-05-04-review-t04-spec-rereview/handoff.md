# Handoff

## Status

APPROVED for T04 spec compliance after idle-refresh fix commit `aae2b9ee6c708409ec4be9f66e51b7a0147d9fd5`.

## Findings

None.

## Review Evidence

- `src/server/auth/current-session.ts:46` hashes the raw session token and looks up the server-side session.
- `src/server/auth/current-session.ts:47` rejects missing, revoked, idle-expired, `expiresAt`-expired, and 30-day absolute-expired sessions through `isSessionActive`.
- `src/server/auth/current-session.ts:51` refreshes activity only after successful authenticated validation by calling `touchSessionActivity`.
- `src/server/repositories/sessions.ts:81` updates only `lastSeenAt`, scoped by `sessionId`, `householdId`, and `revokedAt: null`.
- `src/server/auth/current-session.test.ts:41` proves active authenticated lookup refreshes `lastSeenAt`.
- `src/server/auth/current-session.test.ts:62`, `src/server/auth/current-session.test.ts:78`, and `src/server/auth/current-session.test.ts:95` prove idle-expired, absolute-expired, and revoked sessions are rejected without refresh.

## Original T04 Sweep

- Argon2id password hashing metadata remains versioned with algorithm `argon2id`, memory cost `19456`, time cost `2`, parallelism `1`, hash length `32`, and params version `v1`.
- Session cookies remain `HttpOnly`, `SameSite=Lax`, path `/`, production `Secure`, and max-age derived from absolute expiration.
- Raw session tokens are returned only to cookie-setting helpers and are persisted as HMAC hashes in `tokenHash`.
- Login wrong-password and throttled responses use the same generic failure copy.
- Failed-login throttle defaults remain five attempts in a 15-minute window with a 15-minute throttle, and successful login resets the throttle.
- Persona selection remains scoped through the session household and maps cross-household persona ids to `403`.
- Logout revokes the active session and clears the session cookie.
- `/api/auth/me` returns household/persona/session selection state without password hashes, raw tokens, token hashes, or credential rows.
- Middleware redirects signed-out app requests to `/login`, signed-in requests without a selected persona to `/choose-persona`, and allows selected-persona sessions.
- No production usage of browser sensitive storage was found.

## Verification

- `git status --short`: clean before artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`: passed, 8 files and 15 tests.
- `npm test -- --run src/middleware.test.ts`: passed, 1 file and 3 tests.
- `npm run build`: passed, with the existing non-blocking Next.js edge-runtime static-generation warning.

## Required Fixes

None.
