# Mobile Card UI And State Fix Pass

Last updated: 2026-05-08

## What Was Broken

- Your Cards worked like a narrow card file, but it did not give mobile users a clear way to browse, search, filter, or visually recognize assigned cards.
- Distribute visually emphasized only the current top card, which made the available deck look like a single-card queue even when multiple cards were waiting.
- Your Cards, Board, and Distribute did not consistently show the same Library cover art, so the app felt closer to a task list than a real card deck.
- The persistent welcome banner and Settings welcome replay control consumed product space after the app already had a direct card-first flow.
- The mobile Library overflow action was in the top app header instead of the reachable bottom action area.
- Little Alex relied on pointer handling that could fail on mobile touch browsers.
- The app shell could become wider than the viewport on narrow screens, causing page-level horizontal scrolling.

## Branch And PR Order

1. PR #38, `codex/card-state-distribution`: exposed card artwork in responsibility summaries and added distribution state tests.
2. PR #39, `codex/mobile-shell-touch`: fixed mobile shell overflow placement, removed the welcome banner surface, and added Little Alex touch fallback handling.
3. PR #40, `codex/card-workspace-mobile-ui`: redesigned Distribute, Your Cards, and Board around Library card images.

These PRs were merged in dependency order so UI work could rely on the shared `sourceCoverAssetPath` field and shell overflow fixes.

## Files And Components Changed

- `src/contracts/responsibilities.ts`: responsibility summaries now include optional `sourceCoverAssetPath`.
- `src/server/repositories/responsibilities.ts`: maps source template cover assets into responsibility summaries.
- `src/server/responsibilities/card-distribution.test.ts`: covers assignment/lane movement for Alex and save-for-later flows.
- `src/app/app/layout.tsx`: no longer mounts the persistent welcome banner on protected app pages.
- `src/components/app-shell/app-shell.tsx`: moves mobile overflow to the bottom navigation and constrains the app shell to viewport width.
- `src/components/app-shell/page-shell.tsx`: clips page-level horizontal overflow.
- `src/components/little-alex/little-alex-physics.tsx`: adds touch event fallback dragging while preserving mouse/pointer dragging.
- `src/components/settings/settings-panel.tsx` and `src/components/guide/guide-content.ts`: remove the welcome replay path from current Settings and guide practice copy.
- `src/components/cards/card-workspace.tsx`: makes Distribute, Your Cards, and Board image-first while continuing to use the existing card state helpers.
- `src/app/globals.css` and `src/components/app-shell/app-shell.tsx`: explicitly hide closed overflow panels so hidden mobile menu links cannot reserve geometry or collide with Little Alex visual QA.
- `e2e/corrective-responsive-visual.spec.ts`: adds a 320px narrow-mobile viewport to the responsive app-page smoke.
- Tests were updated across the matching component, contract, service, repository, and Playwright guide specs.

## Card State Flow

Library source templates own the reusable card cover assets. When a source template becomes a household responsibility, repository summaries now carry the source cover path through `sourceCoverAssetPath`.

The three card tabs use the same source of truth:

- `/app/distribute`, `/app/your-cards`, and `/app/board` all load `responsibilityService.listOverview(session)`.
- `CardWorkspace` receives those responsibility summaries and renders the selected view.
- Distribute uses `getDistributableCards()` from `src/components/cards/card-state.ts`, which maps stable persisted lanes to product buckets and filters unassigned cards.
- Distribution server actions call `distributeResponsibilityCard()`, update board lane plus assignments, then revalidate Distribute, Your Cards, and Board.
- Your Cards uses `getCardsForPersona()` against the refreshed responsibility list, so a card assigned to Alex or Max appears in that persona's gallery.
- Board uses `groupCardsByBucket()` against the same refreshed list, so every bucket reflects the same persisted movement.

No duplicate placeholder card system was added. Missing cover art falls back to a simple accessible cover block, but real Library cover images are used whenever `sourceCoverAssetPath` is present.

## Mobile Layout Decisions

- Distribute now keeps the swipe card large, adds a visible available-card list, and auto-advances after the current card is distributed.
- Your Cards is now a searchable, cadence-filterable gallery with image-first cards.
- Board no longer depends on page-level horizontal lane scrolling; buckets are stacked/collapsible sections on mobile and grid into columns on larger screens.
- The mobile overflow menu lives in the bottom navigation as the fifth action, keeping Card Library reachable by thumb.
- The shell and page wrappers use max-width and overflow clipping so any remaining horizontal scrolling is scoped to intentional inner controls.
- Little Alex supports explicit touch start/move/end handling for mobile browsers and keeps desktop mouse behavior intact.

## Known Tradeoffs And Follow-Ups

- The retired welcome component and replay API remain in the codebase for compatibility/history, but they are no longer mounted in the protected app shell or exposed from Settings.
- Board sections default open. A later pass could remember collapsed bucket preferences if users want denser board scanning.
- The legacy `src/components/responsibilities/` Load Map compatibility surface still has its old lane scroller, but `/app/load-map` redirects to the new Board.
- iOS Add to Home Screen behavior remains a real-device release check.
- Fallback card covers show neutral "Card cover" text while preserving `Title cover` as the accessible image label. Real Library cover art still renders whenever a source cover path exists.

## QA Performed

- PR #38: focused responsibility/contract/repository tests, full Vitest, typecheck, and lint.
- PR #39: focused app shell, guide, Settings, Little Alex, and distribution tests; full Vitest before merge; typecheck and lint.
- PR #40: focused card-workspace/distribution/shell/Little Alex tests, full Vitest, typecheck, and lint.
- Final integrated checks:
  - `npm run prisma:validate`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --run` passed with 89 files and 517 tests.
  - `npm run build`
  - `env 'DATABASE_URL=postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' SESSION_SECRET=fairplay-e2e-secret npm run test:e2e` passed with 27 Playwright tests.
- Mobile/responsive QA covered 320px narrow mobile, 390px mobile, 768px small tablet, 1024px short desktop, 1280px desktop, and 1366px laptop widths through `e2e/corrective-responsive-visual.spec.ts`.
- E2E caught and this pass fixed:
  - Closed mobile overflow panels exposing measurable hidden link rectangles that overlapped Little Alex QA checks.
  - Fallback cover title text duplicating compact Board card titles.

The responsive e2e smoke verifies Distribute, Your Cards, Board, Ask Greg, Check-ins, Settings, and Theory across mobile/desktop widths with no document-level horizontal overflow. Little Alex e2e covers dragging/flinging, mobile landscape containment, bottom-nav tap safety, reduced motion, and sprite presentations.
