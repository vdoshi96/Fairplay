# Gaps

## Blocking

1. Real board mutations do not update the visible board state.
   - `src/app/app/radar/page.tsx` renders `<RadarBoard items={items} />` from the initial server query.
   - `src/components/radar/radar-board.tsx` creates, publishes, defers, resolves, schedules, and dismisses via `fetch`, but does not mutate local item state or refresh the route.
   - The route-mocked e2e test replaces `/app/radar` with handcrafted HTML, so it does not catch this production flow gap.

2. Desired timing and defer revisit dates are not persisted or surfaced.
   - T07 requires create/update support for desired timing and defer support for an optional revisit date.
   - `RadarCreateSchema` and `RadarUpdateSchema` have no desired timing field.
   - `RadarDeferMutationSchema` accepts `deferredUntil`, but `radarService.defer` drops it and Prisma `RadarItem` has no `deferredUntil` column.
   - This is not an acceptable T08 placeholder because T08 depends on T07 radar and is explicitly constrained from modifying Prisma/radar internals except through approved blockers.

## Non-Blocking Notes

- Route-mocked radar e2e is documented in the implementation artifacts as not DB-backed.
- Scheduling with `targetCheckInId: null` as a check-in-ready placeholder is acceptable until T08 creates richer agenda/check-in item wiring.
