# Task 9: Verification, PR, and Merge

## Expectations

- Verify the personal-use redesign branch end to end as far as the local environment allows.
- Push the implementation branch to GitHub.
- Open a draft PR for review.
- Do not merge until DB-backed repository tests can run against Postgres and any PR checks pass.

## Outputs

- Branch: `codex/personal-use-redesign`.
- Latest implementation commit before this report: `17a4133 fix: use optimized local card images`.
- Source assets: `public/assets/fairplay/cards/` contains 100 PNG cover assets.
- Runtime seed/contracts scan: no `https://trello.com`, `coverUrl`, or `sourceCoverUrl` references remain in source seed/contracts/runtime seed files.

## Verification Results

- `npm run lint`: passed with exit code 0.
- `npm run typecheck`: passed with exit code 0.
- `npm run prisma:validate && npm run prisma:generate`: passed with exit code 0.
- `npx vitest run --exclude 'src/server/repositories/persistence.integration.test.ts' --exclude 'src/server/repositories/card-templates.test.ts' --exclude 'src/server/repositories/preferences.test.ts'`: passed, 65 files and 239 tests.
- `npm run build`: passed with exit code 0.
- `npm test`: attempted the full suite; 65 files and 239 tests passed, while 3 DB-backed repository files failed because Postgres was unreachable at `localhost:5432`.
- `npm run db:up`: failed with `docker: command not found`, confirming the local environment cannot start the expected Postgres container.

## Challenges

- DB-backed repository and integration tests remain unverified locally because Docker is not installed and no Postgres server is reachable at `localhost:5432`.
- Browser verification against protected app routes was not run locally because the protected app depends on the same database-backed auth/session flow.
- The PR should stay draft until DB integration tests and browser checks can run in an environment with Postgres.

## Next Handoff

- Run `npm run db:up`, `npm run db:wait`, migrations, seed, and full `npm test` in an environment with Docker/Postgres.
- Then run browser verification for create household, persistent welcome, crash-course replay, card library, and load-board move persistence.
- Merge only after checks pass and local `main` can fast-forward to `origin/main`.
