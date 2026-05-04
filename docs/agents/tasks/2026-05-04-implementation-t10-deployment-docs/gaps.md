# Gaps

- Docker is unavailable in this workspace, so DB-backed repository tests and DB-backed protected-route e2e flows were not run here.
- `npm run test:e2e` can run only against the existing route-mocked Playwright coverage in this environment.
- Production readiness still requires running migrations and DB-backed verification against the selected Postgres-compatible database.
