# Gaps

- The Playwright check-in e2e is route-mocked because local DB-backed protected app flows are not available in this workspace.
- Agenda preview currently uses the create route to obtain suggested items in the client launcher; the service still honors active check-in resume semantics. A future refinement could add a dedicated preview endpoint or server-provided suggestions before creation.
- Responsibility visibility changes from check-in decisions are supported as an explicit effect, but the current UI does not expose a dedicated visibility decision control.
- The required root `/app/check-ins` navigation is implemented as a redirect to `/app/check-ins/new`.
