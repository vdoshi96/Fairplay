# Handoff

## Status

`CHANGES_REQUESTED`

## Findings

1. `/api/load-snapshot` now returns an unhandled server error for authenticated sessions without a selected persona.
   - Owner: T06 implementation worker.
   - Evidence: `src/server/responsibilities/service.ts` now makes `listOverview` call `requireSelectedPersona`, which throws `ResponsibilityServiceError` with code `AUTH_REQUIRED` when `session.selectedPersonaId` is missing. `src/app/api/responsibilities/route.ts` catches that code and maps it to `401`, but `src/app/api/load-snapshot/route.ts` calls `responsibilityService.listOverview(session)` without a try/catch or service error mapping.
   - Impact: after the privacy fix, a valid authenticated session that has not selected Alex or Max gets a 500-style route failure from `/api/load-snapshot` instead of the expected auth/persona-required response. This is an adjacent T06 route regression from the selected-persona overview change.
   - Required fix: update `src/app/api/load-snapshot/route.ts` to handle `AUTH_REQUIRED` consistently with `/api/responsibilities`, and add a route test for an authenticated session with `selectedPersonaId: null`.

## Resolved Prior Findings

- Generic responsibility PATCH no longer bypasses status or assignment transition rules. `ResponsibilityUpdateSchema` omits `status`, `currentAssignments`, and `visibility`, and the generic PATCH route rejects transition fields before service update.
- Dedicated status and assignment paths remain the transition paths. Service coverage confirms archive confirmation, status event recording, accountable-owner handoff/revisit enforcement, assignment replacement, and assignment event recording.
- Load overview radar linkage is now selected-persona scoped. The service requires a selected persona and calls the persona-scoped radar repository path; tests cover Alex/Max private draft separation.
- Production coverage improved: contract/API/component/service tests now cover generic PATCH rejection, editor payload shape, dedicated status/assignment route delegation, load-map filters, linked radar handling, and selected-persona overview behavior.

## Verification

- `git status --short`: clean before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`: passed, 9 files and 33 tests.
- `npm run test:e2e -- --grep "responsibility|load map"`: passed, 1 Chromium test, with existing `NO_COLOR`/`FORCE_COLOR` warnings.
- `npm run build`: passed, with the existing Next.js Edge Runtime/static-generation warning.
