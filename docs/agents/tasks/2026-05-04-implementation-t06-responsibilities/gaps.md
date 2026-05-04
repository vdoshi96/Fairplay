# Gaps

- DB-backed service/API verification was not attempted before final verification because the existing project history notes local Postgres is unavailable in this environment; T06 service tests use injected dependencies and API tests mock the service/session boundary.
- Playwright responsibility flow is route-mocked, matching the current DB-unavailable e2e pattern. It verifies the user journey contract but not live Prisma persistence.
- Radar flagging creates linked radar items through the existing radar repository path, but the full radar UI remains T07 scope.
- The load map component supports a radar-flag filter through optional flagged ids; the current T06 server overview returns aggregate open radar counts but not per-responsibility radar ids.
