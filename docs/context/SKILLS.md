# Fairplay Skill Notes

Last updated: 2026-05-07

## Skills Used For This Pass

- `context-scope-router`: routed the request to repo-level project memory plus compiled wiki.
- `project-context-bootstrap`: created the missing standard memory files.
- `ambient-context-retrieval`: inspected existing docs, README, configs, package files, routes, entrypoints, tests, and major directories before editing.
- `compiled-project-wiki`: consolidated current project understanding into `docs/wiki/`.

## Project Workflows To Reuse

### Start Of Work

1. Read `AGENTS.md`.
2. Read `docs/context/STATUS.md`.
3. Read only the relevant context/wiki pages for the task.
4. Use `rg` and current code to confirm implementation details.
5. Mark stale or unclear facts as `needs verification`.

### Feature Or Bugfix Work

1. Check `docs/product/ip-safety-review.md` before touching copy, templates, prompts, relationship-support flows, auth/session, seed data, or visuals.
2. Check `docs/product/visual-system.md` before UI, motion, character, or asset work.
3. Keep Zod contracts, service logic, repositories, routes, UI, and tests aligned.
4. Prefer focused Vitest tests before or alongside behavior changes.
5. Use Playwright for user-facing and responsive UI verification.

### Release/Readiness Work

1. Run lint, typecheck, Vitest, Playwright, build, and Prisma validation.
2. Run DB-backed repository tests and persisted browser flows in a Postgres-capable environment.
3. Confirm env values are configured outside source.
4. Recheck sensitive storage, cookie/session behavior, private-source policy, and relationship-safety copy.

### Memory Maintenance

1. Update `docs/context/STATUS.md` after meaningful discovery, implementation, or verification.
2. Add durable decisions to `docs/context/DECISIONS.md`.
3. Add source/provenance notes to `docs/context/SOURCES.md`.
4. Add a chronological note to `docs/context/LOG.md`.
5. Refresh `docs/wiki/index.md`, `docs/wiki/architecture.md`, or `docs/wiki/file-map.md` when the system map changes.
