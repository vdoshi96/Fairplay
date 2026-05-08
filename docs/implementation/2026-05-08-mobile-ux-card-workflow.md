# Mobile UX Card Workflow Fix

Date: 2026-05-08

## What Changed

- Little Alex now renders only on desktop pointer layouts: `(min-width: 1024px) and (hover: hover) and (pointer: fine)`.
- Mobile and touch-first layouts do not render Little Alex or reserve inline helper space, so the helper cannot compete with page scrolling.
- Settings includes a compact mobile-only note: “Little Alex is available on desktop. Open FairPlay on a desktop browser to play with him.”
- Ask Greg layout wrappers, draft cards, review panels, inputs, and buttons now constrain to the viewport with `min-w-0`, `max-w-full`, wrapping text, and mobile padding.
- Deal swipe instructions moved directly under search and above the active card.
- Deal stores the last successful assignment and exposes a one-step Undo that returns the card to the dealable pool.
- Card detail “Fogging Estandards” now uses an editable textarea backed by `Responsibility.householdStandard`; the purpose section remains read-only.
- Card backs and detail text use wrapping/expanding containers instead of clipped fixed-height text.

## Mobile Gesture Thresholds

Deal cards intentionally avoid locking touch gestures on `pointerdown`.

- `TOUCH_SCROLL_DISTANCE_PX = 12`: once a touch moves vertically by at least 12px and vertical movement clearly dominates, the card drag is canceled so the page can scroll normally.
- `TOUCH_DRAG_LOCK_DISTANCE_PX = 18`: horizontal card dragging starts only after a small but clear horizontal movement.
- `HORIZONTAL_SWIPE_DISTANCE_PX = 112`: left/right assignment requires a committed horizontal drag, not a tap or small nudge.
- `VERTICAL_SWIPE_DISTANCE_PX = 176`: up/down actions require a stronger drag than horizontal assignment because normal phone scrolling is vertical.
- `HORIZONTAL_DOMINANCE_RATIO = 1.25`: left/right assignment requires horizontal movement to clearly exceed vertical movement.
- `VERTICAL_DOMINANCE_RATIO = 1.45`: up/down assignment requires even stronger vertical dominance to avoid accidental Not Applicable or Save for later actions during scroll.

The thresholds bias toward preserving page scroll on mobile. Button actions remain visible for all four Deal destinations.

## Manual QA Steps

- Mobile 320px and 390px: open Deal, scroll the page starting on the card, and confirm no card is assigned.
- Mobile 320px and 390px: intentionally swipe left/right on the card and confirm Alex/Max assignment still works.
- Mobile: assign by button, confirm Undo appears, tap Undo, and confirm the same card returns to Deal.
- Mobile: open Settings and confirm Little Alex is absent from the page but the desktop-only note is visible in the Little Alex section.
- Desktop: open a protected app route and confirm Little Alex appears, can be dragged/flung, and still respects reduced motion.
- Mobile: open Ask Greg and confirm capture, tracker, review panel, message text, inputs, and buttons do not overflow horizontally.
- Mobile: open a card detail page with long purpose text, confirm it wraps, edit Fogging Estandards, save, navigate away/back, and confirm the edit persists.
- Desktop: spot-check Deal, Board, Your Deck, Library, and card detail workflows for unchanged card movement behavior.

## Verification Run

- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` passed with 28 Playwright tests.
- `npm test -- --run` passed with 90 files and 549 tests.
- Browser QA against `http://localhost:3102` confirmed desktop Little Alex rendering, mobile Little Alex absence, mobile Settings note, Deal instructions, last-action Undo, Ask Greg mobile mount, and card-detail Estandards persistence after navigation.
- A Chromium 320px touch-input probe confirmed vertical touch movement on the active Deal card did not assign, intentional horizontal touch movement did assign, Undo restored the card, and Ask Greg document overflow was 0px.

## Known Limitations

- Undo is last-action-only for this pass.
- Vertical touch card actions are deliberately harder to trigger than horizontal assignment; use the visible buttons when phone scrolling takes priority.
- Little Alex settings remain editable on mobile, but the helper itself only renders on desktop pointer layouts.
