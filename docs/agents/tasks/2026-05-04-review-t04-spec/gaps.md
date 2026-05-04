# Gaps

## Blocking

- `getCurrentSession` checks `lastSeenAt` for seven-day idle expiration but does not refresh it on successful authenticated access. Only persona selection updates `lastSeenAt`, so a session used daily can still expire after seven days if the persona is not switched. This does not satisfy the T04 idle-expiration requirement as an inactivity timeout.

## Non-Blocking Notes

- The verification suite passed in this environment.
- T04 artifacts exist under `docs/agents/tasks/2026-05-04-implementation-t04-auth-apis/`.
- The build emits a Next.js warning that using edge runtime disables static generation for that page; this did not affect the auth/session/persona spec result.
