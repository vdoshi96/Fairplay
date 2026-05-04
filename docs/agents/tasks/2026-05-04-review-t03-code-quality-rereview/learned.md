# Learned

- Prisma `upsert` with `failedAttemptCount: { increment: 1 }` removes the stale-count overwrite risk for existing auth throttle rows.
- Returning the updated row from the atomic write gives the repository a safe persisted count for deciding when to set `throttledUntil`.
- First-attempt concurrency still needs unique-key handling because multiple requests can race to create the initial throttle row.
- The repository integration suite now includes 12 tests after adding repeated and concurrent auth-throttle cases, but local verification still requires Postgres at `localhost:5432`.
