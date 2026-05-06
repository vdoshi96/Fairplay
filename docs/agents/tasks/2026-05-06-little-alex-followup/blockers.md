# Blockers

## Active Blockers

- None.

## Watch Items

- Docker is not installed in this local environment, so `npm run db:up` cannot start Postgres. A local Postgres instance was already reachable via `npm run db:wait`, allowing Playwright to run successfully.
- Visual QA screenshots are saved under `test-results/little-alex-followup/`; this directory is ignored and intentionally not committed.
