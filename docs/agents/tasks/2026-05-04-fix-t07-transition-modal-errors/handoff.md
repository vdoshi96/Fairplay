# Handoff

## Status

`DONE`

## Summary

- Generic radar PATCH no longer accepts transition-only `state` or `targetCheckInId` metadata and the service update path only forwards editable fields.
- Added a dedicated dismiss contract, service transition, and `/api/radar/[id]/dismiss` route; the board no longer dismisses through generic PATCH.
- Transition cleanup now clears stale metadata consistently:
  - publish/open clears `resolvedAt`, `deferredUntil`, and `targetCheckInId`
  - defer sets `deferredUntil` and clears `resolvedAt`/`targetCheckInId`
  - resolve sets `resolvedAt` and clears `deferredUntil`/`targetCheckInId`
  - schedule sets `targetCheckInId` or scheduled placeholder and clears `deferredUntil`/`resolvedAt`
  - dismiss clears active transition metadata
- Radar board mutation failures now surface visible alerts and preserve create inputs, edit state, publish confirmation state, and transition context.
- Publish confirmation is now an accessible keyboard-modal dialog with `aria-modal`, initial focus, Tab wrapping, Escape/cancel close, focus restoration, and background inerting.
- Stale revisit metadata is not displayed outside deferred items.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/radar src/components/radar src/app/api/radar src/contracts/radar`: passed, 10 files and 56 tests.
- `npm run test:e2e -- --grep "radar"`: passed, 1 Chromium test. Existing `NO_COLOR`/`FORCE_COLOR` warnings appeared.
- `npm run build`: passed on rerun, with the existing Edge Runtime/static-generation warning.
- `git diff --check`: passed.

## Notes

- An initial `npm run build` run overlapped with Playwright and failed with `Cannot find module for page: /_document`; rerunning `npm run build` alone passed.
