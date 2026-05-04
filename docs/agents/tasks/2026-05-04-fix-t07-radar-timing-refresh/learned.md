# Learned

- T07 already accepts `deferredUntil` at the route/contract boundary, but the service does not pass it to persistence.
- The production `RadarBoard` renders from the initial `items` prop and does not update after successful fetch mutations.
- Existing repository integration tests are DB-backed and currently require a running Postgres at `localhost:5432`.
- `prisma migrate diff --from-migrations` needs a shadow database URL here; diffing from the pre-change schema file works without a live DB and produced the expected ALTER TABLE SQL.
