# Gaps

- API tests mock repository boundaries and do not require live Postgres.
- Existing T03 repository integration tests remain DB-limited in this environment, but T04 required auth/persona tests do not depend on them.
- `getCurrentSession` enforces idle expiration from `lastSeenAt`; extending `lastSeenAt` on every authenticated read would require a repository touch helper outside T04 ownership.
