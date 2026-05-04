# Learned

- `getCurrentSession` is the central authenticated lookup path for `/api/auth/me`, logout, persona selection, and middleware-driven app-route checks.
- The idle-refresh fix preserves the intended order: authenticate token, reject revoked/expired/idle sessions, then refresh `lastSeenAt`.
- Absolute expiration remains anchored to `createdAt` and `expiresAt`; the fix does not update session `expiresAt` or cookie max age.
- The active-session regression fixture covers a session created more than seven days ago but active within the last seven days, which directly addresses the prior inactivity-timeout gap.
- No production usage of `localStorage`, `sessionStorage`, `indexedDB`, or client-side cookie writes was found during the re-sweep.
