# Work Log

- Confirmed `src/app/api/load-snapshot/route.ts` directly awaited `responsibilityService.listOverview(session)` without a service error handler.
- Compared against `src/app/api/responsibilities/route.ts`, which maps `AUTH_REQUIRED` to `{ error: "Authentication required." }` with HTTP 401.
- Added a failing route test for an authenticated session with `selectedPersonaId: null` and a service `AUTH_REQUIRED` rejection.
- Updated the load-snapshot route to return the same 401-style response for `AUTH_REQUIRED`.
- Re-ran the focused load-snapshot route test and confirmed it passes.
