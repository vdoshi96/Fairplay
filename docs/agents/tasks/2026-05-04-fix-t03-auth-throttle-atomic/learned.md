# Learned

- `AuthThrottle` already has the required unique key on `(usernameNormalized, ipHash)`, so no schema or migration change is needed for an atomic upsert/update flow.
- The repository integration suite uses a shared Prisma client and defaults to local Postgres at `localhost:5432` when `DATABASE_URL` is unset.
- Prisma atomic `increment` can be used in the `upsert` update branch so concurrent failed-login writes cannot overwrite each other with stale literal counts.
