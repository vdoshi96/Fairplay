# Gaps

- Live database verification remains open because Docker/Postgres is unavailable locally. A DB-capable owner should run migration apply, seed, and repository integration tests against a real Postgres instance.
- Auth-throttle persistence needs an atomic increment/update path and integration coverage for repeated and concurrent failed-login attempts.
- Future API tasks should keep using repository functions as the persistence boundary and avoid direct Prisma writes from route handlers.
