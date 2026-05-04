# Handoff

Status: `CHANGES_REQUESTED`

## Required Fixes

1. Owner: T08 implementation/fix worker.
   Validate `recordDecision` responsibility ids against the current item relationship before creating a decision or applying responsibility effects. A decision for a custom item or unrelated radar item must not be able to mutate an arbitrary household responsibility.

2. Owner: T08 implementation/fix worker.
   Make decision recording transactionally coherent. At minimum, atomically create/link the decision to the item, require an active check-in and mutable item state, and prevent duplicate or replacement decisions from creating orphan check-in decisions that later appear in summaries.

3. Owner: T08 implementation/fix worker.
   Add guided flow mutation failure and pending states. Skip/defer/record/complete should announce errors accessibly, preserve typed decision summary/review date on failure, restore or move focus sensibly, and disable duplicate submissions while pending.

## Verification Already Run

- `git status --short`: clean before review artifacts.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`: passed, 28 tests.
- `npm run test:e2e -- --grep "check-in"`: passed, 2 tests, route-mocked check-in caveat applies.
- `npm run build`: passed, with the existing non-blocking Next.js edge-runtime/static-generation warning.

## Notes

- No production code was modified by this review.
- After fixes, add focused service/API/component tests before relying on the route-mocked e2e.
