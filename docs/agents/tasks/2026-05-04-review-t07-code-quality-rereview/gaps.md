# Gaps

- Radar Playwright coverage remains route-mocked, so it verifies the frontend flow and request shapes but not DB-backed persistence.
- Live Postgres-backed repository verification was not part of this rereview command set.
- The build still reports the existing non-blocking Next.js warning that Edge Runtime disables static generation for affected pages.
