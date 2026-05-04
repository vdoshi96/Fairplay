# Handoff

## Status

`CHANGES_REQUESTED`

## Findings

1. `[P1] Agenda cap can still exceed five through public APIs.`
   - Files: `src/app/api/check-ins/route.ts`, `src/app/api/check-ins/preview/route.ts`, `src/server/check-ins/agenda.ts`.
   - The T08 checklist requires agenda suggestions to be capped at 5. Both create and preview route schemas allow `maxItems` up to 8, and `buildSuggestedAgenda` slices to the caller-supplied value. Since the service can load 5 radar items and 5 responsibilities, a client can create or preview 6 to 8 agenda items. The default UI sends 5, but the public route/service behavior still violates the max-5 requirement.

## Prior Findings Re-Review

- Preview no longer creates or resumes active check-ins: resolved. `checkInService.preview` builds suggestions without `getActiveCheckIn` or `createCheckIn`, and `/api/check-ins/preview` is covered.
- Removed suggestions are respected when starting: resolved for new starts. `NewCheckInLauncher` derives `radarItemIds` and `responsibilityIds` from the current preview list, and component coverage verifies removed suggestions are omitted.
- Item updates are scoped by check-in id, item id, and household: resolved. The service loads the household check-in, verifies the item is nested in that active check-in, and persistence updates by `id` plus `checkInId`; service coverage rejects a mismatched item id before mutation.
- Structured responsibility owner/review-date decisions: resolved. The UI exposes owner and review-date controls for responsibility owner/role decisions and sends a real `responsibilityEffect`; service coverage confirms responsibility decisions route through `applyResponsibilityDecision`.

## Required Fix

Owner: T08 guided check-in implementation/fix worker.

- Clamp or reject `maxItems` above 5 consistently for preview and create.
- Add regression coverage proving `maxItems: 8` cannot produce more than 5 agenda items through the service and route layer.

## Verification

- `git status --short`: passed with no output before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`: passed, 8 files and 24 tests.
- `npm run test:e2e -- --grep "check-in"`: passed, 2 Chromium tests; route-mocked.
- `npm run build`: passed, with the existing Edge Runtime/static-generation warning.
