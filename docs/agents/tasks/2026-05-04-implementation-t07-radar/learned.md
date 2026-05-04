# Learned

- The existing radar contract and Prisma `RadarItem` model do not include a separate persisted `desiredTiming` field. T07 scheduling can attach `targetCheckInId` or set `state: scheduled` with `targetCheckInId: null` as a check-in-ready placeholder.
- The T03 radar repository already filters private drafts by selected persona for list/state operations, but T07 needed a higher-level service for detail, create/update fields, publish confirmation, and schedule/defer/resolve transitions.
- T06 responsibility overview depends on persona-scoped radar summaries, so radar service list/detail must keep private draft filtering independent and explicit.
- Existing protected app e2e flows use route-mocked pages when DB-backed auth/persistence is unavailable, so the radar e2e follows that pattern.
