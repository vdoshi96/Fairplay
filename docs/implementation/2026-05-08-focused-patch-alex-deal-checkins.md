# 2026-05-08 Focused Patch: Little Alex, Deal State, Board Removal, Check-ins

## Scope

Focused patch pass for the user-reported issues:

- Mobile Little Alex grab/drag/fling was not realistic on phone touch.
- Little Alex ragdoll left/right hand assets were visually swapped.
- Deal could become empty while household cards were still not explicitly classified.
- Board cards needed a way back to the unclassified Deal/Library pool.
- Check-in needed no visible "Run/Learn this feature" launcher, consistent scheduling inputs, and persisted history.

## Findings

- Little Alex desktop behavior was pointer-based and mostly correct. The mobile failure came from two compounding issues:
  - The forgiving grab overlay was recalculated with desktop-only geometry after physics sync, so on mobile it could drift away from the scaled visible helper.
  - Mobile touch needed a clear pending/held/dragging state and a larger target so a finger can realistically hold before dragging.
- Ragdoll hand sprites were not physics-related. The runtime asset mapping assigned the right-hand artifact to the left arm part and vice versa.
- Card state was split between status, board lane, and assignments. The old lane-only deck filtering could treat legacy active `not_in_play` records as unavailable even though they had no explicit Save for Later classification.
- Deal and Library were not showing the same unclassified household pool. Deal read responsibilities, while Library only displayed source templates plus direct lane creation actions.
- Check-in records already persisted in the database. The missing piece was a history read model and UI table, not a new storage mechanism.

## State Model Changes

Every responsibility card now maps to exactly one product bucket through `bucketForCard`:

- `alex`: accountable/shared owner is Alex, or legacy lane is `player_1`.
- `max`: accountable/shared owner is Max, or legacy lane is `player_2`.
- `notApplicable`: status is `not_relevant`, or lane is `trimmed`.
- `savedForLater`: status is `paused`.
- `unassigned`: anything else, including legacy active unowned cards in `cards_of_concern`, `kid_split`, or `not_in_play`.

Deal, Board, Your Deck, and Library now use this adapter instead of lane-only assumptions. Sending a board card back uses distribution bucket `unassigned`, which clears active assignments, sets status `unassigned`, and moves the card to `cards_of_concern`.

Check-in history is a read model over persisted `CheckIn` rows:

- `previousCheckInDate`: scheduled date first, then completed date, then started date.
- `occurred`: true only when the row is completed with a completion timestamp.
- `minutes`: stored summary text, normalized to a blank string when the user completes with no notes.

## Assumptions

- Persisted board-lane enum values remain stable. Product labels and behavior are normalized in the UI/service adapter rather than renaming database values.
- `not_in_play` only means Save for Later when paired with explicit paused status. Active unowned legacy records are unclassified.
- Check-in history should include scheduled rows as "occurred: No" so users can see scheduled records as well as completed records.
- Library may still create a source template directly into a terminal bucket, but it also exposes the existing unclassified household pool and can create a template into Deal via `unassigned`.

## QA Plan

- Unit coverage:
  - Little Alex mobile grab target alignment, held/dragging state, desktop pointer behavior, and swapped hand asset mapping.
  - Card adapter bucket normalization, Deal deck progression, vertical swipe gestures, and Board "Remove from board."
  - Distribution service returning cards to `unassigned`.
  - Library unclassified pool shelf.
  - Check-in schedule date/time inputs, blank minutes persistence, and history table.
- Browser QA:
  - Mobile viewport Little Alex press-hold, drag, fling/release, and reset.
  - Desktop Little Alex drag/release still behaves as before.
  - Mobile Deal swipe left/right/up/down.
  - Board remove action makes the card visible again in Deal and Library after refresh.
  - Check-in completed history survives reload.

## Verification Log

Initial focused verification passed:

```bash
npm test -- src/components/little-alex/little-alex-physics.test.tsx src/components/cards/card-state.test.ts src/components/cards/card-workspace.test.tsx src/server/responsibilities/card-distribution.test.ts src/components/check-ins/check-in-flow.test.tsx src/server/check-ins/service.test.ts src/components/library/card-library.test.tsx src/components/app-shell/app-shell.test.tsx --run
npm run typecheck
npm run lint
```

Final verification passed:

```bash
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright test e2e/check-in.spec.ts e2e/corrective-responsive-visual.spec.ts --project=chromium
npx playwright test e2e/little-alex-physics.spec.ts --project=chromium
npm run test:e2e
```

Final full-suite results:

- Vitest: 89 files, 530 tests passed.
- Playwright: 28 tests passed.
- Build completed successfully.
- Browser QA covered responsive mobile/desktop pages, mobile Little Alex constraints, desktop Little Alex physics, corrected ragdoll sprite assets, persisted Check-in history, and Board removal returning a card to Deal and Library.
