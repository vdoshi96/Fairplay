# Focused Patch Run: Distribute, More Menu, Little Alex

Last updated: 2026-05-08

## PR Order

1. PR #42, `codex/focused-distribute-availability`.
2. PR #44, `codex/focused-more-menu`.
3. PR #43, `codex/focused-little-alex-drag`.

The fixes were kept separate because they touch independent surfaces: card distribution state, app-shell navigation, and Little Alex interaction handling.

## Files Changed

- `src/components/cards/card-workspace.tsx`
- `src/components/cards/card-workspace.test.tsx`
- `src/app/globals.css`
- `src/components/app-shell/app-shell.tsx`
- `src/components/app-shell/app-shell.test.tsx`
- `src/components/little-alex/little-alex-physics.tsx`
- `src/components/little-alex/little-alex-physics.test.tsx`
- `docs/helper-system/README.md`
- `docs/implementation/2026-05-08-focused-patch-run.md`
- `docs/context/STATUS.md`
- `docs/context/LOG.md`
- `docs/product/card-first-mobile-redesign.md`

## Root Causes

### Distribute Availability

`CardWorkspace` optimistically removed the active card from local `removedIds` before the server action finished. With a one-card visible deck or a slow move, the UI could show the completed empty state while the move was still pending. The remaining-card flow already relied on the same unassigned lane filter, so the patch keeps the active card visible until placement resolves and preserves the existing advance-to-next-card behavior after success.

### More Menu

The mobile overflow used a bottom-nav `details` panel with hidden link geometry and clipped placement. A stale global rule for `.fp-overflow-menu:not([open])` still hid the new controlled menu in real browsers, and the first dismiss-layer pass closed on `pointerdown`, allowing the following click to land on the page underneath. Chromium also constrained fixed descendants inside the bottom nav because of `backdrop-blur`, so the dismiss layer only covered the nav instead of the viewport.

### Little Alex Drag

Little Alex began touch drags immediately on touch start, and the grab target behaved like a drag-only touch surface. That made normal scroll gestures over the hit area able to activate the mascot. The patch adds a pending touch-grab state with press-and-hold and movement thresholds, cancels scroll-like vertical movement, keeps `touch-action: pan-y`, and preserves immediate mouse/pen pointer dragging with pointer capture.

## Fix Approach

- Distribute: move local card removal, selection clearing, and last-action messaging until after `onDistribute` resolves.
- More menu: replace the `details` menu with explicit open state, `aria-expanded`, conditional menu rendering, fixed mobile positioning, visible Check-in/Settings links, and a transparent dismiss target that absorbs pointerdown and closes on its own click. The stale `[open]` CSS rule was removed, and bottom-nav blur was removed so fixed menu/dismiss elements are viewport-relative in Chromium.
- Little Alex: add pending touch state, pointer capture helper, drag/scroll intent detection, pending cleanup on release/cancel/unmount, and documentation for the final interaction behavior.

## Manual QA Steps

Distribute flow:

1. Start with multiple unassigned cards available.
2. Assign one card to Alex.
3. Confirm the next undistributed cards remain available.
4. Assign cards to Max, Saved for Later, and Not Applicable.
5. Confirm the empty state appears only after all cards are in final buckets.

Navigation:

1. Open the app at mobile width.
2. Tap More in the bottom nav.
3. Confirm Check-in and Settings are visible menu links.
4. Confirm each route opens correctly.
5. Reopen More and tap outside the menu; confirm it closes without navigation.

Little Alex:

1. Scroll normally near Little Alex and confirm he does not activate from the scroll gesture.
2. Press and hold Little Alex, then drag; confirm the grab is reliable.
3. Drag with mouse/trackpad and confirm immediate pointer dragging still works.
4. Confirm fling, chat bubble, ragdoll recovery, idle standing/walking, reset, and reduced-motion behavior still work.

## Rendered QA Performed

Using the local dev server and Playwright browser automation, a fresh household was created with four unassigned QA cards. The rendered flow confirmed:

- After assigning one card to Alex, three cards remained available and the empty state stayed hidden.
- The Alex card appeared in Your Cards.
- The remaining cards were assigned to Max, Saved for Later, and Not Applicable.
- The Distribute empty state appeared only after all four cards reached final buckets.
- Board buckets contained the expected card titles in Alex, Max, Saved for Later, and Not Applicable.
- At 390px mobile width, More opened visibly and exposed Check-in and Settings.
- Tapping outside More closed it without navigating.
- Check-in and Settings routes opened from the More menu.
- At desktop width, the More navigation also exposed Check-in and Settings.
- Little Alex ignored a scroll-like touch near the grab target, then entered dragging after a deliberate press-hold, showed the existing bubble on release, and settled back to the normal state.

## Automated Verification

- Baseline on `main` before patching: `npm test -- --run` passed with 89 files and 517 tests.
- PR #42:
  - `npm test -- src/components/cards/card-workspace.test.tsx src/components/cards/card-state.test.ts src/server/responsibilities/card-distribution.test.ts --run`
  - `npm run typecheck`
  - `npm run lint`
- PR #44:
  - `npm test -- src/components/app-shell/app-shell.test.tsx --run`
  - `npm run typecheck`
  - `npm run lint`
- PR #43:
  - `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
  - `npm run typecheck`
  - `npm run lint`

Final integrated verification:

- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` passed with 89 files and 520 tests.
- `npm run build`
- `DATABASE_URL=postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public SESSION_SECRET=fairplay-e2e-secret npm run test:e2e` passed with 27 Playwright tests.

## Known Limitations

- A mostly vertical Little Alex touch drag requires the short hold first, because immediate vertical movement is treated as scroll intent.
- The Distribute patch intentionally does not introduce a new card-state field; it continues to use the accepted lane-to-bucket adapter.
- The mobile bottom nav no longer uses `backdrop-blur`; Chromium treated it as a containing block for fixed menu children, which prevented the dismiss layer from covering the viewport.
- Browser/device QA should still include real iOS Safari before release because Add to Home Screen and touch gesture arbitration can differ from desktop automation.
