# Handoff

## Status

`CHANGES_REQUESTED`

## Required Fixes

Owner: T08 guided check-in implementation/fix worker.

1. Split agenda preview/draft from active check-in creation.
   - Add a non-mutating preview path or create a true draft check-in that can be edited before activation.
   - Ensure removed preview items are not present when the user starts the check-in.
   - Add component/API/service coverage for preview, remove, start, and resume semantics.

2. Scope item mutations to the checked household check-in.
   - Update item writes to require both `id` and `checkInId` belonging to the session household, or otherwise verify the item is in the loaded household check-in before writing.
   - Add a regression test where a valid check-in id is paired with another household's item id and the write is rejected.

3. Add explicit structured responsibility decision controls to the guided UI.
   - At minimum, support the required owner/review-date decision flow with a real owner/effect payload instead of summary-only text.
   - Extend tests so the UI decision form proves it sends an explicit responsibility effect and the service applies it through the existing responsibility service path.

## Review Notes

- Skip and defer are normal item states and are not framed as failures.
- Summaries are factual and calm, covering decisions, deferred topics, skipped topics, and review dates without grievance, score, or clinical language.
- Radar item visibility labels are preserved in the guided flow.
- T08 implementation artifacts exist and document mocked e2e coverage.

## Verification

- `git status --short` passed with no output before review artifacts were created.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins` passed: 7 files, 18 tests.
- `npm run test:e2e -- --grep "check-in"` passed: 2 Chromium tests, route-mocked and not DB-backed.
- `npm run build` passed, with the existing Edge Runtime/static-generation warning.
