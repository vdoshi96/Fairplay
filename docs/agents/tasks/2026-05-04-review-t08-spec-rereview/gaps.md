# Gaps

## Blocking

1. Agenda size is still externally bypassable above the T08 max-5 requirement.
   - `src/app/api/check-ins/route.ts` accepts `maxItems` up to 8.
   - `src/app/api/check-ins/preview/route.ts` accepts `maxItems` up to 8.
   - `src/server/check-ins/agenda.ts` uses the supplied `maxItems` directly when slicing agenda items.
   - Because the source query can return up to 10 candidate items, a client can request 6 to 8 agenda items even though the T08 tests/checks require the agenda to be capped at 5.

## Non-Blocking Notes

- The check-in e2e coverage remains route-mocked and does not prove DB-backed persistence, matching the prior implementation and fix handoffs.
- Recent responsibility changes are still not a distinct agenda source; this was noted in the original T08 spec review as a non-blocking refinement while open radar and due reviews remain covered.
