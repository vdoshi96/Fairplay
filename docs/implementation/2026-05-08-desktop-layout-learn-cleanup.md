# Desktop Layout And Learn Cleanup

## Summary

This pass tightened the desktop Ask Greg and Board layouts while keeping mobile behavior intact, added short purpose subtitles for Your Deck and Board, and removed the retired "Learn this feature" feature-guide/dummy practice workflow from active code.

## Changes

- Reworked `/app/ask-greg` into a single desktop composition with a larger Greg image panel and packed header, draft action, and draft tracker spacing.
- Reworked Board desktop layout so Alex and Max are the primary lanes. Save for Later and Not Applicable remain accessible as secondary buckets, stacked beside the primary lanes on wide desktop and below them on laptop/tablet widths.
- Restyled Board cards to align more closely with Your Deck cards: image-first treatment, white surfaces, borders, shadows, tighter typography, cadence chip, and polished action areas.
- Added concise subtitles to Your Deck and Board.
- Removed active feature-guide launcher/tour/practice code, Library and Settings dummy workflows, guide data attributes, and the onboarding-preview AI draft route.
- Removed obsolete feature-guide entries from the generated UI asset registry.
- Removed retired Load Map component/lane metadata files that were no longer imported; `/app/load-map` remains a redirect to Board.
- Raised Little Alex above the page content layer but below the desktop sidebar so the reserved helper area remains draggable in reduced-motion mode.

## Verification

- `git diff --check`
- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run` (84 files, 493 tests)
- `npm run build`
- `npx playwright test e2e/little-alex-physics.spec.ts --project=chromium --grep "uses a static draggable-safe mode with reduced motion"`
- `npm run test:e2e` (28 Playwright tests)

Rendered QA also covered Ask Greg and Board at 1440x900, 1024x768, 390x844, and 320x740, plus Library/Settings guide-query checks to confirm no Learn workflow remains accessible.
