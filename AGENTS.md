# Fairplay Agent Guide

This repo has a durable project-memory layer. Read the smallest useful slice before changing code:

1. Start here, then read `docs/context/STATUS.md`.
2. Read `docs/context/PROJECT.md` for product intent, stack, safety/IP constraints, and non-goals.
3. Read `docs/context/DECISIONS.md` before changing architecture, data model, auth, AI generation, routing, naming, or product behavior.
4. Read `docs/context/SOURCES.md` before using external or reference material.
5. Read `docs/wiki/index.md`, then only the wiki pages relevant to the files you will touch.
6. Use current code as the source of truth when docs and implementation disagree. Update memory after confirming the current behavior.

## Operating Rules

- Preserve user and agent work. The repo may contain local worktrees and generated artifacts; do not delete or reorganize them unless asked.
- Private local material under `References/` is ignored by git. Do not open, copy, summarize, commit, or train implementation choices from those files unless the user explicitly approves that exact source review.
- Do not commit `.env`, `.env.local`, API keys, database credentials, session secrets, plaintext passwords, real household records, or private reference files.
- Follow the existing Next.js App Router, TypeScript, Tailwind, Prisma, Vitest, and Playwright patterns.
- Keep product copy practical and non-clinical. Do not add therapy, diagnosis, crisis, partner-scoring, blame, or unsafe-confrontation language.
- For UI work, keep the app mobile-first, accessible, warm, and operationally dense. Respect the existing Fairplay visual tokens and 8px radius convention.
- Prefer platform-neutral domain contracts and server services for durable behavior. Route handlers should call service/repository layers rather than duplicating business rules.
- Mark unclear, stale, dead, or suspicious files as `needs verification` instead of guessing.

## Memory Map

- `docs/context/PROJECT.md`: durable product and technical summary.
- `docs/context/STATUS.md`: current phase, known blockers, verification state, and cleanup candidates.
- `docs/context/DECISIONS.md`: durable decisions and rationale.
- `docs/context/SOURCES.md`: source inventory and provenance rules.
- `docs/context/SKILLS.md`: project workflows and skill usage notes.
- `docs/context/LOG.md`: chronological handoff notes.
- `docs/wiki/index.md`: compiled wiki navigation and high-level map.
- `docs/wiki/architecture.md`: current architecture, data flow, and boundaries.
- `docs/wiki/file-map.md`: practical repo index and haphazard-area notes.

## Common Commands

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
npm run prisma:validate
npm run prisma:generate
npm run db:up
npm run db:wait
npm run prisma:migrate
npm run prisma:seed
```

DB-backed tests require a running Postgres-compatible database. Local Docker is expected by `compose.yaml`, but previous docs note Docker was unavailable in at least one implementation workspace.
