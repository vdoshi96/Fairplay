# Gaps

1. Direct service calls can still exceed the five-item agenda cap with negative `maxItems`.
   - `src/server/check-ins/agenda.ts:51` uses `Math.min` to clamp only high values.
   - `src/server/check-ins/agenda.ts:104` then calls `items.slice(0, maxItems)`.
   - For `maxItems: -1`, JavaScript slices all but the last item, so a 10-source agenda can return 9 items.
   - The create and preview HTTP routes reject negative values, but the service path is still not cap-safe for all direct callers.

2. The check-in e2e coverage remains route-mocked rather than DB-backed.
   - This matches the existing T08 implementation/review notes and is not a new blocker.

3. Recent responsibility changes are still not a distinct agenda source.
   - This was previously recorded as a non-blocking refinement because open radar and due reviews are covered.
