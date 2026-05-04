# Learned

- The Prisma schema and migration align at static-review level for the T03 tables, enums, indexes, unique constraints, and foreign keys.
- The repository layer now scopes the main household/persona-sensitive writes and reads for responsibilities, radar, check-ins, and sessions.
- The Prisma client uses the standard module-level singleton pattern with non-production global caching. It is build-safe in the observed Next build and does not connect until queries run.
- The seed script is idempotent through slug-based upserts and imports only the reviewed `DEMO_RESPONSIBILITY_TEMPLATES` set.
- The repository integration tests are meaningful for household/persona isolation, but this local environment cannot execute them without Postgres at `localhost:5432`.
- `AuthThrottle` is security-sensitive in a Vercel/serverless environment because multiple failed-login requests may hit separate invocations concurrently.
