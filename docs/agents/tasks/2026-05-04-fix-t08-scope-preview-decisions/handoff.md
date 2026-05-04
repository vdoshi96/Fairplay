# Handoff

## Status

`COMPLETED`

## Summary

- Added non-mutating agenda preview through `POST /api/check-ins/preview`; `NewCheckInLauncher` now previews suggestions there and only starts/resumes through `POST /api/check-ins`.
- Start payloads include ids for selected preview items by item type, so removed suggestions stay removed and linked radar responsibilities are not expanded into separate selected responsibility items.
- `updateItem` now rejects item ids that are not nested in the active household check-in before calling the persistence dependency.
- Prisma item writes now require both `id` and `checkInId` for item state and decision-item updates.
- Guided responsibility decisions now expose owner selection for Alex/Max plus review date and send structured `assign_owner`/`change_role` or `schedule_review` responsibility effects.

## Verification

- Initial `git status --short`: clean.
- Red tests observed for missing preview service/route, preview UI side effect, missing owner control, selected-id payload expansion, and cross-check-in item update acceptance.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`: passed, 8 files, 24 tests.
- `npm run test:e2e -- --grep "check-in"`: passed, 2 Chromium tests, with existing `NO_COLOR`/`FORCE_COLOR` warnings.
- `npm run build`: passed, with the existing Edge Runtime/static-generation warning.
- `git diff --check`: passed.
- Pre-commit `git status --short`: showed only the focused T08 fix files and task artifacts.
