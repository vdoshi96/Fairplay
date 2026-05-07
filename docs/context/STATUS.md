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
- Current route inventory includes 15 page routes and 37 API route handlers.
- Current source inventory includes about 258 TypeScript/TSX files under `src/`, 105 test/spec files across `src` and `e2e`, and 275 Fairplay public asset files.

## Recent Product State From Existing Docs

- Product-surface cleanup retired the Radar page/component from the app navigation surface.
- Radar API/service/schema code still exists and is still referenced by responsibility/check-in flows.
- AI card generation was restored to produce generated cover art for successful text-input drafts.
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

- Radar backend/code retention after product-surface cleanup retired the Radar UI.
- Generated assets with Radar names after Radar UI retirement.
- `src/server/radar`, `src/contracts/radar.ts`, `/api/radar/**`, and radar-linked check-in logic ownership.
- Board lane enum/database names that still use `player_1`, `player_2`, `kid_split`, and `cards_of_concern`.
- Deprecated `/api/ai-card-drafts/[id]/regenerate-image` route behavior and whether it should remain for compatibility.
- Older docs that claim there is no `localStorage` usage. Current code uses `localStorage` for non-sensitive theme preference.
- Local ignored clutter: `.DS_Store`, `docs/.DS_Store`, `docs/agents/.DS_Store`, `docs/superpowers/.DS_Store`, `References/.DS_Store`, and `tsconfig.tsbuildinfo`.

## Suggested Cleanup Plan

1. Stabilize this memory/wiki layer as the shared map for future agents.
2. Verify current product decisions around Radar, board lane naming, and deprecated AI routes before deleting or renaming anything.
3. Split cleanup into small PRs by ownership: docs hygiene, generated/ignored clutter, legacy Radar surface, schema naming compatibility, and asset inventory.
4. Add or refresh tests before removing legacy route/service/schema behavior.
5. Run full verification, including DB-backed repository tests and persisted browser flows, after each behavioral cleanup.
