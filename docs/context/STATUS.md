# Fairplay Status

Last updated: 2026-05-08

## Current Phase

The focused catalog/deal/board and Little Alex fix is implemented on top of the Deal/Your Deck naming polish. The active product now treats Library source cards and Deal cards as the same catalog-backed set: Deal materializes the full source catalog for a household, Library no longer has a visible put-in-play workflow, and Board shows only cards assigned/categorized to Alex, Max, Save for later, or Not applicable. Little Alex touch dragging now separates grab/drag from ragdoll/fling so mobile hold follows the finger and ragdoll starts only after release behavior.

## Branch And Working Tree

- Local `main` has been fast-forwarded through PR #45.
- The catalog/deal/board and Little Alex fix is being applied on top of the ordered focused patch merges and naming polish.
- Recent merged UX/card PRs: #32 foundation/background/copy, #33 Load Map dashboard, #34 Library/card practice, #35 lightweight Check-ins, #38 state/artwork summaries, #39 mobile shell/touch/welcome removal, #40 image-first card workspace, #42 Distribute availability, #44 More menu, #43 Little Alex touch intent, and #45 focused patch QA/docs.

## What Exists

- Production app scaffold and feature implementation are present.
- Standard memory files were missing before this pass and have now been created.
- Existing history is extensive under `docs/agents/tasks/` with 96 task directories.
- Current route inventory includes the card-first app routes `/app/your-cards`, `/app/distribute`, `/app/board`, and `/app/ask-greg`; `/app/home` and `/app/load-map` redirect to the new flow.
- Current source inventory includes about 236 TypeScript/TSX files under `src/`, 95 test/spec files across `src` and `e2e`, and 270 Fairplay public asset files.

## Recent Product State

- Global generated backgrounds are stronger and paired with theme-aware washes so foreground surfaces remain readable.
- The previous homepage is retired. Root, login, and persona selection land on Deal for signed-in selected-persona sessions.
- Cards are the primary interaction model: Distribution supports search, an available-card list, tap/click flip, swipe left/right/up/down, arrow keys, and large fallback buttons.
- Your Deck is a searchable, cadence-filterable, image-first assigned-card gallery; tapping a card flips it to show assignment, purpose, and Fogging E-Standards.
- Board groups only real dealt/categorized cards: Alex, Max, Saved for Later, and Not Applicable. Unassigned is now an internal dealable-pool state, not a Board lane.
- Mobile overflow navigation now opens from the bottom action area with visible Check-in, Settings, Theory, and Card Library links plus an outside-tap dismiss layer that closes without click-through navigation. The persistent welcome banner is no longer mounted in the protected app shell.
- Little Alex has intentional touch fallback dragging for mobile browsers while preserving immediate desktop mouse/pointer behavior; touch hold grabs without ragdolling until release/collision behavior.
- Library cards flip in place as the full source catalog. The visible put-in-play/lane-pick workflow has been removed from the Library catalog flow.
- Deal shows the full catalog-backed dealable pool and dedupes by stable template identity; Board removal clears categorization back into that pool without creating duplicate cards.
- Ask Greg is a main tab for drafting more cards.
- Check-ins is now a lightweight schedule, confirm, optional notes, and persisted history flow; agenda/decision concepts and the visible feature guide launcher are no longer visible in the UI.
- Crash Course has been rewritten as concise concept-first storyboard frames with the app learning path only at the end.
- Product-surface cleanup retired the Radar page/component from the app navigation surface.
- This cleanup pass removed the Radar backend/API/model/assets from the active product surface.
- AI card generation was restored to produce generated cover art for successful text-input drafts.
- Crash course now uses a 14-frame storyboard with subtitle-style course text attached to the image frame.
- Crash-course storyboard art was regenerated with Qwen into 14 textless 3:2 PNGs under `public/assets/fairplay/generated-ui/crash-course/`.
- Corrective QA on the latest integration branch reported passing Vitest, lint, typecheck, Prisma validate, build, and Playwright e2e.

## Verification From This Pass

Card-first mobile fix branch verification passed:

```bash
npm test -- --run
npm run typecheck
npm run lint
```

PR-specific focused suites also covered responsibility distribution state, card workspace rendering, app shell overflow placement, Settings welcome removal, and Little Alex touch handling. Final integrated build/e2e/mobile smoke passed and is tracked in `docs/implementation/2026-05-08-mobile-card-ui-state-fix.md`.

Focused patch-run verification covered Distribute pending card availability, mobile More menu visibility/dismiss behavior, and Little Alex touch intent. Rendered browser QA also confirmed a four-card distribution flow, visible mobile/desktop More links, outside-tap close without navigation, and deliberate Little Alex touch dragging. Details are tracked in `docs/implementation/2026-05-08-focused-patch-run.md`.

The latest focused patch pass covered Little Alex mobile grab alignment and ragdoll hand mapping, Deal/Library/Board card-state normalization, Board removal back to the unclassified pool, consistent Check-in scheduling, and persisted Check-in history. Details are tracked in `docs/implementation/2026-05-08-focused-patch-alex-deal-checkins.md`.

The catalog/deal/board and Little Alex fix materialized one active household responsibility per source template, added safe duplicate archival/indexing, removed Library put-in-play controls, removed Board Unassigned, and verified mobile/desktop Little Alex drag/fling behavior. Details are tracked in `docs/implementation/2026-05-08-catalog-deal-board-little-alex.md`.

## Known Blockers

- Vercel preview for PR #28 historically failed before build because `prisma migrate deploy` could not reach `db.prisma.io:5432` (`P1001`). Confirm deployment DB reachability before release if that infrastructure has not changed.
- Production runtime needs both `DATABASE_URL` and `SESSION_SECRET`; local production smoke failed until those were explicitly provided to `next start`.
- `.env.local` exists locally and is ignored; it was not read.
- `References/` exists locally and is ignored; it was not read.

## Needs Verification

- Deprecated `/api/ai-card-drafts/[id]/regenerate-image` route behavior and whether it should remain for compatibility.
- Browser storage audit beyond theme-only `localStorage`: household data, private drafts, sensitive notes, concern details, session secrets, API keys, credentials, and plaintext passwords must remain out of `localStorage`, `sessionStorage`, and `indexedDB`.
- Local ignored clutter: `.DS_Store`, `docs/.DS_Store`, `docs/agents/.DS_Store`, `docs/superpowers/.DS_Store`, `References/.DS_Store`, and `tsconfig.tsbuildinfo`.

## Verified This Pass

- Applied `20260507120000_remove_radar` to the local Postgres database.
- Reran `npm run test -- --run`; all 85 test files and 475 tests passed, including `src/server/repositories/persistence.integration.test.ts`.
- Accepted the board lane recommendation: keep persisted lane keys stable and use UI labels; any rename should be a separate compatibility migration.
- For the crash-course storyboard refresh, ran `npm run assets:generate-ui -- --skip-existing --delay-ms=0`, `npm run lint`, `npm run typecheck`, `npm test -- --run` with 85 test files and 481 tests passing, `npm run build`, and the targeted Playwright responsive visual check for app pages.
- For the current Crash Course concept polish, `npm test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-page-client.test.tsx --run` passed with 2 files and 12 tests.
- Final branch verification passed: `npm run lint`, `npm run typecheck`, `npm test -- --run` (86 files, 498 tests), `npm run prisma:validate`, `npm run build`, `npx playwright test e2e/corrective-responsive-visual.spec.ts --project=chromium`, `npx playwright test e2e/dark-mode-visual.spec.ts e2e/guided-learning.spec.ts --project=chromium` after stale QA assertions were updated, and `npx playwright test e2e/guided-learning.spec.ts --project=chromium`.
- Card-first rebuild verification passed: Vitest 88 files / 510 tests, full Playwright e2e 27 tests, typecheck, lint, build, and mobile production smoke.
- Mobile card UI/state fix branch verification passed before merge: PR #38 focused tests/full Vitest/typecheck/lint, PR #39 focused tests/full Vitest/typecheck/lint, and PR #40 focused tests/full Vitest/typecheck/lint.
- Final integrated mobile card UI/state verification passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run` (89 files, 517 tests), `npm run build`, `npx playwright test e2e/corrective-responsive-visual.spec.ts --project=chromium`, and full `npm run test:e2e` (27 tests). Responsive visual QA now includes 320px, 390px, 768px, 1024px, 1280px, and 1366px widths.
- Focused patch run before the final documentation PR passed a baseline `npm test -- --run` on main (89 files, 517 tests), plus focused Vitest/typecheck/lint on PRs #42, #44, and #43.
- Final focused patch-run verification passed after the documentation/rendered QA follow-up: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run` (89 files, 520 tests), `npm run build`, full `npm run test:e2e` (27 Playwright tests), and rendered Playwright browser QA for the requested Distribute, More menu, and Little Alex flows.
- Focused Little Alex/Deal/Board/Check-in patch verification passed: `npm run prisma:validate`, `npm run prisma:generate`, `npm run lint`, `npm run typecheck`, `npm test -- --run` (89 files, 530 tests), `npm run build`, targeted Check-in/corrective responsive/Little Alex Playwright, and full `npm run test:e2e` (28 tests).
- Catalog/deal/board and Little Alex verification passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run` (89 files, 538 tests), `npm run build`, targeted corrective responsive/Little Alex/guided-learning/auth Playwright specs, and full `npm run test:e2e -- --workers=1` (28 tests). `npm run prisma:migrate -- --skip-seed` hit local shadow DB permission `P3014`; `prisma migrate deploy` applied the catalog identity migration successfully.

## Suggested Cleanup Plan

1. Stabilize this memory/wiki layer as the shared map for future agents.
2. Verify deprecated AI routes before deleting compatibility behavior.
3. Split cleanup into small PRs by ownership: docs hygiene, generated/ignored clutter, schema naming compatibility, and asset inventory.
4. Add or refresh tests before removing legacy route/service/schema behavior.
5. Run full verification, including DB-backed repository tests and persisted browser flows, after each behavioral cleanup.
