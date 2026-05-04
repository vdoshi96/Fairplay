# Gaps

- DB-backed repository integration tests did not pass in this workspace because no Postgres service is reachable at `localhost:5432`.
- Docker is not installed or available in this workspace, so local Docker Compose Postgres verification could not be run here.
- Production readiness still requires running `npx prisma migrate deploy` and DB-backed tests against the selected database.
