# Controller Build Log: Personal-Use Redesign

## Expectations

- Build from the approved personal-use redesign spec.
- Keep implementation documentation reviewable.
- Dispatch workers with disjoint file ownership where practical.
- Preserve user changes and avoid destructive git operations.
- Download all source card covers into `public/assets/fairplay/cards/` and reference local `coverAssetPath` values only.

## Outputs

- Implementation plan: `docs/superpowers/plans/2026-05-04-fairplay-personal-use-redesign-implementation.md`.
- Implementation branch: `codex/personal-use-redesign`.
- Branch base: current `main` plus cherry-picked research/spec/plan commits.
- Controller integration fix after Task 2/Task 5:
  - Updated legacy responsibility mapper/test fixtures to include required `boardLane` and `boardSortOrder`.
  - Verified `npm run typecheck` passes.
  - Verified `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx src/server/responsibilities/service.test.ts` passes.
- Controller image polish:
  - Swapped new source-card cover renderers from raw `<img>` tags to Next `Image` with local `coverAssetPath` assets.
  - Verified `npm run lint`, `npm run typecheck`, and card/library component tests pass.
- Local Postgres follow-up:
  - Installed `postgresql@16` with Homebrew and started it with `brew services start postgresql@16`.
  - Created the `fairplay` role/database and applied all Prisma migrations through `20260504203000_cascade_persona_owned_records`.
  - Seeded the local database with `npm run prisma:seed`.
  - Updated persona-owned record foreign keys from restrictive deletes to cascade so household cleanup works in repository integration tests.
  - Verified `npm run lint`, `npm run typecheck`, full `npm test`, `npm run build`, and `npm run test:e2e` pass with the local Postgres `DATABASE_URL`.
- Controller self-review fix:
  - Found that `/app/library` displayed the source deck but did not wire "Put in play" to creation.
  - Found that `prisma/seed.ts` was still writing only the old template fields, which dropped source labels, CPE text, minimum standards, local cover paths, source IDs, and default lanes from DB-backed templates.
  - Wired the library page to create from stable source card IDs, added on-demand source-template upsert, and updated the seed script to write the full original-card payload.

## Challenges

- The full 100-card data import is content-heavy and should be isolated from UI work.
- Schema changes are a dependency for board placement, preferences, and source-card APIs.
- Cover assets must be stored in GitHub rather than hotlinked from Trello.
- Docker is unavailable on this machine, so local DB verification uses Homebrew Postgres instead of `npm run db:up`.
- Static source card IDs and generated database template IDs need a bridge because older seeded rows may already exist with generated UUIDs.

## Next Handoff

- Review PR #4, promote it from draft when ready, then merge after GitHub checks are green.
