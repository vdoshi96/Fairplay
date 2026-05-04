# Handoff

## Status

CHANGES_REQUESTED for T04 spec compliance.

## Blocking Finding

`src/server/auth/current-session.ts` validates `lastSeenAt` for idle expiration but returns the session without touching activity time. `src/server/repositories/sessions.ts` updates `lastSeenAt` only during persona selection. As a result, idle expiration is not seven days from last authenticated activity; it is seven days from session creation unless the user switches persona.

## Required Fix

Owner: T04 implementation owner.

Add a session activity touch path that updates `lastSeenAt` after successful authenticated session lookup while preserving the 30-day absolute expiration and revocation checks. Add focused tests showing that:

- `getCurrentSession` or the route-level session access path refreshes `lastSeenAt` for an active session.
- A session active within the last seven days remains valid even when created more than seven days ago but less than 30 days ago.
- A session idle for more than seven days is rejected.
- A session older than 30 days is rejected regardless of recent `lastSeenAt`.

## Verification Already Run

- `git status --short`: clean before artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`: passed.
- `npm test -- --run src/middleware.test.ts`: passed.
- `npm run build`: passed with a non-blocking Next.js edge-runtime warning.
