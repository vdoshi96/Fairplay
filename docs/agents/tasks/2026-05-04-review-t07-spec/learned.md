# Learned

- `radarService.list` and the Prisma-backed `listRecords` both enforce selected-persona private draft filtering while returning non-private household radar items.
- `/api/radar/[id]/publish` parses `RadarPublishMutationSchema`, which rejects private-to-visible publication without `confirmPrivateDraftPublish`.
- The board's e2e coverage is intentionally route-mocked and does not exercise the production React component, authenticated page, API handlers, or persistence together.
- T07's own implementation gap notes already identify missing `desiredTiming` and `deferredUntil` persistence, and T08 is constrained from changing radar/schema internals unless a blocker is approved.
- The real `/app/radar` page passes a static `items` prop to the client board; the default board fetch handlers do not update local state or call a router refresh after mutations.
