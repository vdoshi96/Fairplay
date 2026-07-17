# UI Accessibility And Motion Polish

## Scope

This milestone improves the core card workflow, visual hierarchy, responsive behavior, and keyboard/screen-reader support without changing routes, persisted lanes, ownership rules, or household data.

## Product behavior

- Deal removes the selected card optimistically, reveals the next card immediately, and uses a 200ms directional exit. Failed writes restore the exact card, selection, flip state, and catalog order. Reduced-motion users get the same state change without directional movement.
- Available Cards stays collapsed by default on mobile, expands automatically on desktop, remains searchable, and mounts no more than 20 result rows at a time.
- Board cards expose one 44px Move menu instead of dense action rows. Owner-changing cards route to Ownership Details, writes show card-level pending/error feedback, and the last successful move can be undone.
- Empty Board lanes use compact content instead of tall placeholders.
- Check-in history renders as stacked records below the tablet breakpoint and retains its table on wider screens.

## Accessibility and visual hierarchy

- A reusable dialog/alert-dialog primitive provides initial focus, focus trapping, Escape dismissal, background isolation, and trigger-focus restoration. Archive and ownership confirmations use it.
- Confirmation failures stay inside the active modal so they remain visible and announceable while the background is inert.
- Buttons, form controls, filters, navigation items, and icon controls use at least a 44px target; selection filters expose pressed state.
- Authentication content sits on a theme-adaptive high-opacity surface. Generated backgrounds remain decorative beneath stronger page washes and no longer use text-washing blend modes.
- Fixed background attachment is limited to desktop fine-pointer layouts.

## Compatibility and safety

- Distribution, ownership, assignment, and lane contracts are unchanged.
- Existing touch gestures, arrow-key fallbacks, card flip behavior, and Undo semantics remain available.
- No AI provider keys, live generation calls, or private reference material were used.

## Verification

- Focused component tests cover optimistic success/failure, reduced motion, bounded Available Cards DOM, Board pending/error/Undo, menu keyboard focus, dialog focus trapping/restoration, modal error announcements, mobile Check-in history, auth surfaces, and control semantics.
- Corrective responsive browser QA covers 320, 390, 768, 1024, 1280, and 1366 widths, populated Board state, 44px controls, and a deterministic 200% desktop-zoom layout equivalent.
- Light and dark production-rendered checks retain readable foreground surfaces over decorative artwork.
- Full Prisma, lint, typecheck, Vitest, production build, and Playwright regression gates run before merge.
