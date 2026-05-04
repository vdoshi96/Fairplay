# Learned

- `getCurrentSession` is the shared authenticated lookup path used by `/api/auth/me`, `/api/auth/logout`, persona selection, and middleware-style auth checks.
- Session creation persists only a token hash; the raw token remains cookie-only.
- `selectSessionPersona` already refreshes `lastSeenAt`, but ordinary authenticated reads need their own touch path so idle expiration remains activity based.
- The activity touch can avoid extending absolute expiration by updating only `lastSeenAt`.
