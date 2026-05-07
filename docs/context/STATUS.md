# Fairplay Status

Last updated: 2026-05-07

## Current Phase

Repo indexing and durable memory bootstrap on `main`.

## Branch And Working Tree

- Current branch: `main`.
- Remote tracking: `main...origin/main`.
- Git status before this memory pass: clean.
- Latest visible commit during indexing: `f2b4b87` merge of `codex/product-surface-cleanup`.

## What Exists

- Production app scaffold and feature implementation are present.
- Standard memory files were missing before this pass and have now been created.
- Existing history is extensive under `docs/agents/tasks/` with 96 task directories.
- Current route inventory includes 15 page routes and 30 API route handlers.
- Current source inventory includes about 236 TypeScript/TSX files under `src/`, 95 test/spec files across `src` and `e2e`, and 270 Fairplay public asset files.

## Recent Product State

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

## Suggested Cleanup Plan

1. Stabilize this memory/wiki layer as the shared map for future agents.
2. Verify deprecated AI routes before deleting compatibility behavior.
3. Split cleanup into small PRs by ownership: docs hygiene, generated/ignored clutter, schema naming compatibility, and asset inventory.
4. Add or refresh tests before removing legacy route/service/schema behavior.
5. Run full verification, including DB-backed repository tests and persisted browser flows, after each behavioral cleanup.
