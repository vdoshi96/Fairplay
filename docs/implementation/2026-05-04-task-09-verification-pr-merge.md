# Task 9: Verification, PR, and Merge

## Expectations

- Verify the personal-use redesign branch end to end as far as the local environment allows.
- Push the implementation branch to GitHub.
- Open a draft PR for review.
- Keep the PR draft until the reviewer is comfortable with the redesign scope and GitHub checks are green.

## Outputs

- Branch: `codex/personal-use-redesign`.
- Latest implementation commit before the local Postgres follow-up: `3e71c42 docs: record redesign verification status`.
- Source assets: `public/assets/fairplay/cards/` contains 100 PNG cover assets.
- Runtime seed/contracts scan: no `https://trello.com`, `coverUrl`, or `sourceCoverUrl` references remain in source seed/contracts/runtime seed files.
- Local Postgres was installed with Homebrew, started with `brew services start postgresql@16`, and configured with role/database `fairplay`.
- Added migration `20260504203000_cascade_persona_owned_records` so household cleanup can cascade through persona-owned records used by repository integration tests.
- Controller self-review added Task 10 to activate source cards as real templates from `/app/library` and to seed the complete source payload into `ResponsibilityTemplate`.

## Verification Results

- `npm run lint`: passed with exit code 0.
- `npm run typecheck`: passed with exit code 0.
- `npm run prisma:validate`: passed with exit code 0.
- `npm run prisma:generate`: passed with exit code 0.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx prisma migrate deploy`: applied all migrations through `20260504203000_cascade_persona_owned_records`.
- `npm run prisma:seed`: seeded the local database successfully.
- Local DB query for `auto`: confirmed source card ID, `{Out}` label, local cover asset, `not_in_play` default lane, and real definition text.
- `npx vitest run --exclude 'src/server/repositories/persistence.integration.test.ts' --exclude 'src/server/repositories/card-templates.test.ts' --exclude 'src/server/repositories/preferences.test.ts'`: passed, 65 files and 239 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm test -- src/server/repositories/card-templates.test.ts src/server/repositories/preferences.test.ts src/server/repositories/persistence.integration.test.ts`: passed, 3 files and 19 tests.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm test`: passed, 68 files and 260 tests after Task 10 coverage.
- `npm run build`: passed with exit code 0.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build`: passed with exit code 0.
- `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e`: passed, 10 Playwright tests.

## Challenges

- Docker is still not installed, so `npm run db:up` remains unavailable locally. Homebrew Postgres now provides the local database for migration, repository, unit, build, and browser verification.
- The initial DB-backed test run exposed a real cleanup failure: deleting a household cascaded into records that also had restrictive persona foreign keys. Changing those intra-household persona relations to cascade fixed cleanup without changing source-card or board behavior.
- The self-review caught a product issue before merge: source cards were browseable but not creatable from the library page, and the old seed script would have stripped the original card detail fields from DB templates.
- The PR is still draft so the redesign can be reviewed intentionally before merge.

## Next Handoff

- Review PR #4 and the task reports under `docs/implementation/`.
- Promote the PR from draft when the review is ready.
- Merge only after GitHub checks pass, then fast-forward local `main` to match `origin/main`.
