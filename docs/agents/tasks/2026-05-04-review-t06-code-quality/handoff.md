# Handoff

## Status

`CHANGES_REQUESTED`

## Findings

1. Generic responsibility PATCH bypasses transition-specific validation and event recording.
   - Owner: T06 implementation worker.
   - Evidence: `src/contracts/responsibilities.ts` still permits `status` and `currentAssignments` in `ResponsibilityUpdateSchema`, and `src/app/api/responsibilities/[id]/route.ts` sends parsed PATCH data to `responsibilityService.update`. That service path updates the row without archive confirmation, assignment handoff validation, or `ResponsibilityEvent` creation.
   - Required fix: remove transition fields from the generic update schema/path, or route them through the dedicated status/assignment services in a transactionally consistent way. Add route/service tests proving generic PATCH cannot archive, pause, mark not relevant, restore active, or replace assignments without the dedicated mutation semantics.

2. Load overview leaks linked private radar drafts across personas.
   - Owner: T06 implementation worker, coordinating with T07 if the final radar overview shape changes.
   - Evidence: `responsibilityService.listOverview` requests `deps.listRadarItems(session.householdId)`, and the default dependency queries all `prisma.radarItem` rows for the household. Linked private drafts are then attached to responsibilities because `withLinkedRadarItems` includes any non-`resolved` state.
   - Required fix: require a selected persona for responsibility overview when radar linkage is included, filter radar items with the same private-visibility semantics used by radar list queries, and add regression coverage proving one persona cannot see or filter by the other persona's private linked radar draft.

## Verification Snapshot

- `git status --short`: clean before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`: passed, 9 files and 28 tests.
- `npm run test:e2e -- --grep "responsibility|load map"`: passed, 1 Chromium test, route-mocked.
- `npm run build`: passed, with existing non-blocking Next.js Edge Runtime/static-generation warning.

## Notes

- No production code was modified during this review.
- Review artifacts only are ready to commit with `docs: add T06 code quality review`.

