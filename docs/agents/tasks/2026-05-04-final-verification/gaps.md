# Gaps

- Blocking for production readiness: DB-backed setup could not be completed because Docker is unavailable and Postgres is unreachable at `localhost:5432`.
- Blocking for production readiness: `npm run prisma:migrate -- --name verify`, `npm run prisma:seed`, DB-backed repository tests, and live persisted auth/data browser flow remain unverified in this workspace.
- DB-backed cross-household repository protections are covered by tests in `src/server/repositories/persistence.integration.test.ts`, but those tests did not execute successfully without Postgres.
- Browser verification covered signed-out `/login` rendering and protected-route redirect at mobile and desktop widths. It did not cover authenticated persisted onboarding/home/load-map/radar/check-in flows because the database was unavailable.
- The existing Playwright e2e suite uses route mocks for many flows, so it should not be represented as proof of persisted server/database behavior.
