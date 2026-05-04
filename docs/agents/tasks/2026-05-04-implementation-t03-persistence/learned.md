# Learned

- T02 contracts intentionally keep Prisma out of the shared API surface, so repository mappers are the right boundary for converting dates, enums, assignments, and aggregate snapshots.
- Prisma CLI validation requires a `DATABASE_URL` even for static schema validation, so the npm Prisma/db scripts include the documented local Docker fallback while still respecting a real environment value when present.
- Node 22 can run the TypeScript seed file with `--experimental-strip-types`; using CommonJS-style `require` avoids changing package module type for the whole app.
- Docker is not installed in this execution environment, so database-backed verification cannot be completed here.
