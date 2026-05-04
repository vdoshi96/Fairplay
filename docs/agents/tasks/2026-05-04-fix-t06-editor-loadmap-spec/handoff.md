# Handoff

## Status

`DONE`

## Summary

- Removed `visibility` from existing responsibility edit `PATCH` payloads while preserving visibility on create.
- Added editor controls for relevant days and allowed non-private visibility options.
- Added `POST /api/responsibilities/[id]/visibility` using the responsibility visibility mutation contract, with private responsibility visibility rejected for v1.
- Added relevant-days and linked radar item data to responsibility summaries/details.
- Backed the load-map radar filter with linked radar item ids/state from overview data.
- Displayed area mix and hidden-effort mix signals from the load snapshot.
- Added focused coverage across service, API routes, components, and the route-mocked responsibility e2e flow.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`: passed, 9 files and 28 tests.
- `npm run test:e2e -- --grep "responsibility|load map"`: passed, 1 Chromium test with route-mocked responsibility/load-map pages.
- `npm run build`: passed, with the existing non-blocking Next.js Edge Runtime/static-generation warning.
- `git diff --check`: passed.

## Notes

- The only repository change is mapper exposure of existing `relevantDays`; no Prisma schema or migration changes were made.
- T07 still owns richer radar UI workflows.
