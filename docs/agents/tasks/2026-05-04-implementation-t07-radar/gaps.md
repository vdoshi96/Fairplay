# Gaps

- No persisted `desiredTiming` field exists in the current radar contract or database model. The implementation supports scheduling through `targetCheckInId` and a scheduled check-in-ready placeholder, but a true desired timing value needs a future contract/schema change.
- `RadarDeferMutationSchema` accepts `deferredUntil`, but the current Prisma model has no `deferredUntil` column. The service marks the item `deferred` and clears `resolvedAt`; storing the revisit date requires a future schema/contract update.
- The e2e radar flow is route-mocked rather than DB-backed. This matches earlier local constraints, but it does not prove end-to-end persistence through Postgres.
- Scheduling to a real check-in is ready through `targetCheckInId`; richer agenda/check-in item creation remains a T08 dependency.
