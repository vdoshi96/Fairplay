# Card-First Mobile Redesign

Last updated: 2026-05-08

## Rationale

Fairplay is now centered on responsibility cards instead of a learning homepage or dashboard-first flow. The previous Home, Load Map, and Library model asked users to understand too many surfaces before doing the main job. The redesigned product puts one repeated action at the center: decide where the next responsibility card belongs.

The design follows current mobile guidance: primary content must fit the device width without horizontal page overflow, touch targets must be at least 44px, swipe gestures need visible alternatives, and PWA presentation needs a manifest, icons, theme color, viewport settings, and safe-area-aware fixed navigation.

## Information Architecture

Primary tabs:

- Your Cards: the effective home after distribution. Shows cards assigned to the current persona in a searchable, cadence-filterable, image-first gallery.
- Distribute: the card-swipe deck with a visible available-card list. Left assigns Alex, right assigns Max, up saves for later, and down marks not applicable.
- Board: a grouped card board for Alex, Max, Saved for Later, Not Applicable, and Unassigned, stacked/collapsible on mobile instead of horizontally scrolling lanes.
- Ask Greg: a focused card-generation and advisor surface.

Overflow menu:

- Check-in
- Theory
- Settings
- Card Library

On mobile, the overflow menu lives in the bottom navigation/action area so Card Library remains thumb-reachable.

Legacy routing:

- `/app/home` redirects away from the retired homepage.
- `/app/load-map` redirects to the Board.
- `/app/crash-course` remains the learning route but is labeled Theory in navigation.
- Root and post-login persona selection land on Distribute.

## Card State Model

The database keeps existing `ResponsibilityBoardLane` values for compatibility. The product layer maps them to normalized card buckets:

| Product bucket | Persisted lane | Meaning |
| --- | --- | --- |
| `unassigned` | `cards_of_concern` | Needs distribution |
| `alex` | `player_1` | Assigned to Alex |
| `max` | `player_2` | Assigned to Max |
| `savedForLater` | `not_in_play` | Saved for later |
| `notApplicable` | `trimmed` | Not applicable |

`kid_split` is legacy-compatible and displays as Unassigned until a dedicated migration decides whether to remove or remap it.

## Swipe Behavior

- Swipe left: assign to Alex.
- Swipe right: assign to Max.
- Swipe up: save for later.
- Swipe down: mark not applicable.
- Arrow keys mirror the gestures on desktop.
- Buttons are always visible for users who do not use gestures or assistive technology users who need an alternate input.
- A successful distribution removes the top card from the deck. When the deck is empty, the empty state says: “No more cards to distribute. Generate more cards when ready.”
- All available distributable cards remain visible in the side/below deck list, and selecting one promotes it to the active swipe card.

## Mobile And PWA

- Bottom tabs use fixed safe-area padding so they do not collide with iPhone home indicators.
- Content uses `svh`, safe-area variables, and no document-level horizontal overflow.
- Touch controls are at least 44px high.
- The app manifest and Apple web app metadata remain Vercel-hostable through Next.js App Router metadata routes.
- Service worker behavior is intentionally minimal and must not cache household data.

## QA Checklist

- Mobile Safari-width layout has no horizontal overflow.
- Bottom navigation is reachable and clear of safe areas.
- Swipe deck works with touch, mouse drag, and arrow keys.
- Buttons perform the same actions as swipes.
- Empty states render for no distributable cards and no owned cards.
- Board groups all buckets with card-like components, not table panels.
- Your Cards and Board show the same Library cover art used by source cards.
- Mobile overflow opens from the bottom navigation, not the top app bar.
- Little Alex can be dragged on touch and mouse devices.
- Ask Greg can create/review drafts using existing AI card flows.
- Root, login, and persona selection land on Distribute.
- Vercel build path remains `npm run build`.

## Known Limitations

- Card bucket state uses the existing board-lane column rather than a new database enum to avoid a compatibility migration in this pass.
- Assignment records are updated for Alex/Max ownership moves and cleared for Saved for Later or Not Applicable. Historical lifecycle context is not rewritten by this pass.
- iOS Add to Home Screen behavior still needs manual device verification outside automated Playwright.

## Future Improvements

- Add a dedicated `cardBucket` persistence field once compatibility and migration strategy are approved.
- Make generated cards enter the Distribute deck directly after Greg finishes a draft.
- Add haptic-like visual feedback for successful swipes while respecting reduced motion.
