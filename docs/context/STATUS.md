# Fairplay Status

Last updated: 2026-05-08

## Current Phase

Card-first mobile rebuild is implemented on the local feature branch. The active product now lands signed-in users on Distribute, uses Your Cards as the effective home after assignment, replaces Load Map with Board, and keeps Settings, Check in, Theory, and Card Library in overflow navigation.

## Branch And Working Tree

- Current branch during this pass: `codex/card-first-mobile-rebuild`.
- This pass has not been merged to `main` yet.
- Earlier merged UX polish PRs: #32 foundation/background/copy, #33 Load Map dashboard, #34 Library/card practice, #35 lightweight Check-ins.

## What Exists

- Production app scaffold and feature implementation are present.
- Standard memory files were missing before this pass and have now been created.
- Existing history is extensive under `docs/agents/tasks/` with 96 task directories.
- Current route inventory includes the card-first app routes `/app/your-cards`, `/app/distribute`, `/app/board`, and `/app/ask-greg`; `/app/home` and `/app/load-map` redirect to the new flow.
- Current source inventory includes about 236 TypeScript/TSX files under `src/`, 95 test/spec files across `src` and `e2e`, and 270 Fairplay public asset files.

## Recent Product State

- Global generated backgrounds are stronger and paired with theme-aware washes so foreground surfaces remain readable.
- The previous homepage is retired. Root, login, and persona selection land on Distribute for signed-in selected-persona sessions.
- Cards are the primary interaction model: Distribution supports search, tap/click flip, swipe left/right/up/down, arrow keys, and large fallback buttons.
- Your Cards is a card-file style assigned-card view; tapping a card flips it to show assignment, purpose, and Fogging E-Standards.
- Board groups cards by Alex, Max, Saved for Later, Not Applicable, and Unassigned using card components instead of table-like panels.
- Library cards also flip in place and create cards directly into a selected lane; old "put in play" copy is removed from visible card flows.
- Ask Greg is a main tab for drafting more cards.
- Check-ins is now a lightweight schedule, confirm, and optional notes flow; agenda/decision concepts are no longer visible in the UI.
- Crash Course has been rewritten as concise concept-first storyboard frames with the app learning path only at the end.
- Product-surface cleanup retired the Radar page/component from the app navigation surface.
- This cleanup pass removed the Radar backend/API/model/assets from the active product surface.
- AI card generation was restored to produce generated cover art for successful text-input drafts.
- Crash course now uses a 14-frame storyboard with subtitle-style course text attached to the image frame.
- Crash-course storyboard art was regenerated with Qwen into 14 textless 3:2 PNGs under `public/assets/fairplay/generated-ui/crash-course/`.
- Corrective QA on the latest integration branch reported passing Vitest, lint, typecheck, Prisma validate, build, and Playwright e2e.

## Verification From This Pass

Card-first rebuild verification passed:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
DATABASE_URL=postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public SESSION_SECRET=fairplay-e2e-secret npm run test:e2e
```

Additional production smoke verification used `next start` on port 3020 with local DB/session env and a Playwright iPhone 14 profile. It created a throwaway household, created two cards, verified Distribute search, card flip, Alex button assignment, touch swipe right to Max, Your Cards flip, Board rendering, no document-level horizontal overflow, and manifest `start_url`/maskable icon fields.

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

## Suggested Cleanup Plan

1. Stabilize this memory/wiki layer as the shared map for future agents.
2. Verify deprecated AI routes before deleting compatibility behavior.
3. Split cleanup into small PRs by ownership: docs hygiene, generated/ignored clutter, schema naming compatibility, and asset inventory.
4. Add or refresh tests before removing legacy route/service/schema behavior.
5. Run full verification, including DB-backed repository tests and persisted browser flows, after each behavioral cleanup.
