# Handoff

## Status

`CHANGES_REQUESTED`

## Finding

1. `[P1] Direct service maxItems can still bypass the five-item cap with negative values.`
   - File: `src/server/check-ins/agenda.ts:51`
   - File: `src/server/check-ins/agenda.ts:104`
   - The route schemas now reject `maxItems` above five and below one, and direct service calls with `maxItems: 8` are clamped. However, `buildSuggestedAgenda` still accepts any numeric `options.maxItems`. `Math.min(-1, 5)` remains `-1`, and `items.slice(0, -1)` returns all but the final item. Because agenda sources can contain up to 10 candidates, a direct `checkInService.create(session, { maxItems: -1 })` or `checkInService.preview(session, { maxItems: -1 })` can still create/preview more than five items. This conflicts with the final checklist requirement to confirm the max agenda cap cannot exceed five through the service/create/preview paths.

## Required Fix

Owner: T08 guided check-in implementation/fix worker.

- Normalize or validate `maxItems` at the agenda builder/service boundary so the effective value is always an integer in the inclusive range `1..MAX_AGENDA_ITEMS`, or otherwise reject invalid direct service inputs before agenda generation.
- Add regression coverage proving direct service `create` and `preview` calls with a negative `maxItems` value cannot produce more than five agenda items.

## Prior Findings Re-Review

- Preview no longer creates or resumes active check-ins: resolved.
- Removed suggestions are respected when starting: resolved.
- Item updates are scoped by check-in id, item id, and household: resolved.
- Structured responsibility owner/review-date decisions: resolved.
- Routes reject `maxItems: 8` for create and preview: resolved.
- Direct service calls with `maxItems: 8` are clamped to five: resolved.

## Original T08 Sweep

- Check-in/item states, skip, defer, discussed, active, and completed paths remain covered.
- Skip and defer remain neutral item states and do not create responsibility/radar decisions.
- Explicit decisions remain the only responsibility/radar effect path.
- Generated summaries remain factual and avoid score, winner/loser, clinical, diagnosis, blame, fault, and failure language.
- Radar visibility labels are preserved in guided item display.
- Cross-household check-in access and mismatched nested item updates remain rejected.

## Verification

- `git status --short`: passed with no output before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`: passed, 8 files and 27 tests.
- `npm run test:e2e -- --grep "check-in"`: passed, 2 Chromium tests. The grep matched the check-in flow and one radar spec whose title includes `check-in`; e2e remains route-mocked.
- `npm run build`: passed, with the existing Edge Runtime/static-generation warning.
