# Handoff

## Status

`CHANGES_REQUESTED`

## Required Fixes

1. Align the responsibility edit API and editor payload.
   - Owner: T06 implementation worker.
   - Fix either by removing unsupported `visibility` from the generic PATCH payload and adding an explicit confirmed visibility path, or by updating the edit contract/service to accept documented non-private visibility changes safely while continuing to reject private responsibility visibility.
   - Add regression coverage proving the editor/API can update an existing responsibility's documented fields.

2. Complete v1 responsibility editor field coverage.
   - Owner: T06 implementation worker.
   - Add relevant-days controls and an explicit non-private visibility control/path consistent with the product privacy rules.
   - Keep private responsibility visibility rejected.

3. Back the radar filter with real linked radar data or explicitly defer/remove it for T06.
   - Owner: T06 implementation worker, with T07 owner if the chosen fix depends on radar overview shape.
   - Provide per-responsibility linked radar status in the overview or make the remaining radar behavior clearly T07-scoped without presenting a nonfunctional T06 filter.

4. Add the missing required aggregate summary signals.
   - Owner: T06 implementation worker.
   - Display hidden effort mix and area mix from the existing load snapshot in non-punitive language.

## Verification Snapshot

All required commands passed during review:

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`
- `npm run test:e2e -- --grep "responsibility|load map"`
- `npm run build`

The e2e flow remains route-mocked and should not be treated as DB-backed verification.
