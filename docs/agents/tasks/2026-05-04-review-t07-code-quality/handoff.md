# Handoff

## Status

`CHANGES_REQUESTED`

## Findings

1. Generic radar PATCH bypasses transition-specific validation and timestamp semantics.
   - Owner: T07 implementation worker.
   - Evidence: `src/contracts/radar.ts` permits `state` in `RadarUpdateSchema`, `src/app/api/radar/[id]/route.ts` forwards parsed PATCH data to `radarService.update`, and `src/server/radar/service.ts` passes that state directly to persistence. This lets callers move items into `resolved`, `deferred`, `dismissed`, `scheduled`, `open`, or `draft` without the dedicated publish/defer/resolve/schedule semantics or timestamp cleanup.
   - Required fix: remove `state` from the generic update schema/path, add a dedicated dismiss mutation if dismiss remains required, and add API/service tests proving generic PATCH cannot perform transition-only state changes.

2. Dedicated transitions leave stale transition metadata behind.
   - Owner: T07 implementation worker.
   - Evidence: `resolve` sets `state: "resolved"` and `resolvedAt` but does not clear `deferredUntil` or `targetCheckInId`; `schedule` sets `state: "scheduled"` and `targetCheckInId` but does not clear `resolvedAt` or `deferredUntil`; `defer` clears `resolvedAt` but leaves any prior `targetCheckInId`. The board displays `deferredUntil` anywhere `TimingMeta` is rendered, so a resolved or rescheduled item can still show an obsolete revisit date.
   - Required fix: define and enforce cleanup rules for publish/defer/resolve/dismiss/schedule. Add focused service/component tests for moving from deferred to resolved, resolved to scheduled/open if supported, and scheduled to deferred.

3. Board mutation failure/pending handling is too lossy.
   - Owner: T07 implementation worker.
   - Evidence: `fetchItem` silently returns on non-2xx responses. Callers still clear create form fields, close edit state, or close the publish confirmation before knowing whether the server accepted the mutation. Failed mutations therefore leave users with no visible error and lost input/context.
   - Required fix: surface mutation errors, preserve user input/dialog/edit state on failed responses, and add component tests for failed create, publish, edit, and transition requests.

4. Publish confirmation is not a keyboard-modal dialog.
   - Owner: T07 implementation worker.
   - Evidence: the confirmation is a fixed `div` with `role="dialog"` but no `aria-modal`, focus movement, Escape handling, or focus restoration. Keyboard users can remain outside the confirmation or tab into background controls while deciding whether to publish a private draft.
   - Required fix: implement modal focus management using an accessible dialog pattern or native dialog, including `aria-modal`, initial focus, Escape/Cancel behavior, focus restoration, and regression tests.

## Verification Snapshot

- `git status --short`: clean before review artifact edits.
- `npm run prisma:validate`: passed.
- `npm run prisma:generate`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/radar src/components/radar src/app/api/radar src/contracts/radar`: passed, 9 files and 32 tests.
- `npm run test:e2e -- --grep "radar"`: passed, 1 Chromium test, route-mocked.
- `npm run build`: passed, with the existing Edge Runtime/static-generation warning.

## Notes

- No production code was modified during this review.
- Privacy scoping, linked id validation, nullable timing migration shape, sensitive browser storage, and restricted-language sweeps did not reveal additional blockers.
- Review artifacts only are ready to commit with `docs: add T07 code quality review`.
