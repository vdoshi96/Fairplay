# Fairplay Status

Last updated: 2026-05-08

## Current Phase

App UX polish is in the final Crash Course and responsive QA branch. Foundation/background/copy, Load Map dashboard polish, Library/card practice polish, and lightweight Check-ins have already merged through ordered PRs.

## Branch And Working Tree

- Current branch during this pass: `codex/crash-course-concepts-final-qa`.
- Local `main` matched `origin/main` at `8c13ae9` before this final branch.
- Merged UX polish PRs so far: #32 foundation/background/copy, #33 Load Map dashboard, #34 Library/card practice, #35 lightweight Check-ins.

## What Exists

- Production app scaffold and feature implementation are present.
- Standard memory files were missing before this pass and have now been created.
- Existing history is extensive under `docs/agents/tasks/` with 96 task directories.
- Current route inventory includes 15 page routes and 30 API route handlers.
- Current source inventory includes about 236 TypeScript/TSX files under `src/`, 95 test/spec files across `src` and `e2e`, and 270 Fairplay public asset files.

## Recent Product State

- Global generated backgrounds are stronger and paired with theme-aware washes so foreground surfaces remain readable.
- Home and Settings copy is shorter and uses the shared polished background treatment.
- Load Map has a redesigned dashboard/filter area while preserving the lane board and persisted lane keys.
- Library cards clamp/wrap long copy, the move action uses one compact destination control, and the practice workflow uses plain field labels.
- Check-ins is now a lightweight schedule, confirm, and optional notes flow; agenda/decision concepts are no longer visible in the UI.
- Crash Course has been rewritten as concise concept-first storyboard frames with the app learning path only at the end.
- Product-surface cleanup retired the Radar page/component from the app navigation surface.
- This cleanup pass removed the Radar backend/API/model/assets from the active product surface.
- AI card generation was restored to produce generated cover art for successful text-input drafts.
- Crash course now uses a 14-frame storyboard with subtitle-style course text attached to the image frame.
- Crash-course storyboard art was regenerated with Qwen into 14 textless 3:2 PNGs under `public/assets/fairplay/generated-ui/crash-course/`.
- Corrective QA on the latest integration branch reported passing Vitest, lint, typecheck, Prisma validate, build, and Playwright e2e.

## Verification From This Pass

Commands run during indexing:

```bash
git status --short --branch
rg --files ...
find ...
sed ...
git check-ignore -v .env.local References .DS_Store docs/.DS_Store tsconfig.tsbuildinfo test-results
git log --oneline --decorate -8
for f in AGENTS.md docs/context/PROJECT.md docs/context/STATUS.md docs/context/DECISIONS.md docs/context/SOURCES.md docs/context/SKILLS.md docs/context/LOG.md docs/wiki/index.md docs/wiki/architecture.md docs/wiki/file-map.md; do test -s "$f"; done
rg -n '[ \t]+$' AGENTS.md docs/context docs/wiki
```

Result: requested files are present and non-empty. The trailing-whitespace scan returned no matches. This was documentation and indexing work only. Full app test suites were not rerun.

## Known Blockers

- Vercel preview for PR #28 historically failed before build because `prisma migrate deploy` could not reach `db.prisma.io:5432` (`P1001`). Confirm deployment DB reachability before release if that infrastructure has not changed.
- Live DB-backed verification has historically been blocked when Docker/Postgres is unavailable. Run the DB-backed repository tests and persisted browser flows in a Postgres-capable environment before release.
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

## Suggested Cleanup Plan

1. Stabilize this memory/wiki layer as the shared map for future agents.
2. Verify deprecated AI routes before deleting compatibility behavior.
3. Split cleanup into small PRs by ownership: docs hygiene, generated/ignored clutter, schema naming compatibility, and asset inventory.
4. Add or refresh tests before removing legacy route/service/schema behavior.
5. Run full verification, including DB-backed repository tests and persisted browser flows, after each behavioral cleanup.
