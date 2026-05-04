# Learned

- T04 depends on T03 repository helpers for household creation, persona membership checks, session persistence, and auth throttling.
- Session cookies must contain only the opaque raw session token; database persistence stores only the token hash.
- Middleware persona redirects require checking server session state without placing persona or household data in browser storage.
- The middleware uses `/api/auth/me` to inspect server-side persona state, avoiding an extra browser cookie for selected persona state.
- T03 throttle persistence increments counters atomically, so T04 resets an expired 15-minute window before recording a new failed login.
