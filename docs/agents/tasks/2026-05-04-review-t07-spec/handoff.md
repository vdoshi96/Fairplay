# Handoff

## Status

`CHANGES_REQUESTED`

## Required Fixes

Owner: T07 radar implementation/fix worker.

1. Make the real radar board complete its user flows after mutations.
   - After create, publish, defer, resolve, dismiss, and schedule, update the board's local item state or refresh the route.
   - Add tests against the production component/page behavior so route-mocked e2e does not hide stale UI.

2. Persist and surface T07 timing fields.
   - Add a spec-aligned desired timing field to the radar contract, Prisma model/migration, repository/service mapping, API routes, UI create/edit controls, and tests.
   - Persist defer revisit dates (`deferredUntil` or the chosen spec name) instead of accepting and dropping the value.
   - Ensure API detail/list/UI expose the persisted timing information where needed for check-in planning.

## Review Notes

- Private draft persona filtering, explicit private publish confirmation, visibility labels, neutral reason labels, defer/resolve/schedule/dismiss action presence, and safety-copy language were otherwise aligned with the T07 spec.
- The route-mocked radar e2e remains acceptable only as documented supplemental coverage; it should not be cited as DB-backed or production UI flow verification.

## Verification

- `git status --short` showed only review artifact changes before manifest/controller-log updates.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- --run src/server/radar src/components/radar src/app/api/radar` passed: 8 files, 21 tests.
- `npm run test:e2e -- --grep "radar"` passed: 1 Chromium test, route-mocked and not DB-backed.
- `npm run build` passed, with the existing Edge Runtime/static-generation warning.
