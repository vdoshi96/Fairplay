# Fairplay Project Context

Last updated: 2026-05-07

## Product Intent

Fairplay is a mobile-first household responsibility planning app. It helps a household make shared work visible, decide who owns what, surface hidden coordination load, and revisit decisions through calm check-ins.

The current v1 product centers on a two-person household using shared credentials and default personas Alex and Max. It is household organization and practical relationship support, not therapy, crisis support, legal advice, medical advice, financial advice, diagnosis, or a partner-scoring system.

## Confirmed User Workflows

- Create a household with one household username and password.
- Log in with shared credentials, then choose Alex or Max for the session.
- Complete onboarding, crash-course, and feature-guide learning flows.
- Use the Home learning hub to reach the core app surfaces.
- Manage the Load Map board and responsibility details.
- Browse the Library and create AI-assisted responsibility card drafts.
- Start, preview, complete, and review guided check-ins.
- Manage settings, theme preference, welcome replay, crash-course replay, persona preferences, and Little Alex preferences.

## Current Stack

- App framework: Next.js App Router 15.3.1 with React 19.1.0 and TypeScript 5.8.
- Styling: Tailwind CSS 3.4 with Fairplay CSS variables in `src/app/globals.css`.
- Persistence: Prisma 6.7 with Postgres-compatible database.
- Auth/session: server-managed sessions, opaque cookies, Argon2id password hashing, and auth throttling.
- Tests: Vitest with jsdom and React Testing Library; Playwright e2e on a local Next dev server.
- AI generation: Qwen primary provider for AI card text/cover generation, optional OpenAI fallback gated by env.
- Deployment target: Vercel-compatible Next.js app with managed Postgres.

## Current Architecture Shape

- `src/app/` owns App Router pages, layouts, route handlers, PWA metadata, and global CSS.
- `src/components/` owns client/server UI components by feature area.
- `src/contracts/` owns Zod schemas and platform-neutral JSON contracts.
- `src/domain/` owns ids, enums, load-signal math, time, and visibility helpers.
- `src/server/` owns services, repositories, auth utilities, AI providers, and Prisma access.
- `prisma/` owns the schema, migrations, and seed entrypoint.
- `e2e/` owns Playwright flows and visual QA.
- `public/assets/fairplay/` owns generated UI backgrounds, card assets, and Little Alex sprites.
- `docs/` contains product docs, implementation logs, agent task logs, generated memory, and wiki notes.

## Safety And IP Constraints

- Private local reference material in `References/` is excluded from git and was not inspected during this indexing pass.
- Use only paraphrased, cleared project docs unless the user explicitly authorizes source-specific review.
- Do not copy source text, proprietary taxonomies, source-like deck/workbook structures, public app UI, or distinctive reference visuals.
- Keep private/shared/partner-visible/check-in-only states explicit anywhere sensitive notes can exist.
- Browser storage is prohibited for household data, private drafts, sensitive notes, concern details, session secrets, API keys, credentials, plaintext passwords, or other private records.
- Theme-only `localStorage` is allowed for non-sensitive device UI preference. Treat any other `localStorage`, `sessionStorage`, or `indexedDB` use as security/privacy-sensitive until reviewed.

## Non-Goals

- No therapy, diagnosis, crisis support, partner scoring, blame ledgers, moral grades, or winner/loser framing.
- No email auth, social auth, magic links, billing, subscriptions, public sharing, exports, deletion workflows, household exit, or revocation in current v1.
- No full starter deck, source-like card library, copied assessment, copied source flow, copied template catalog, or private reference ingestion.
- No active Radar product area, API, model, or generated asset set after the 2026-05-07 cleanup pass.
- No broad file reorganization until the repo has a verified map and cleanup plan.

## Open Questions

- Whether board lane names such as `cards_of_concern`, `player_1`, `player_2`, and `kid_split` should be renamed in schema/contracts after UI cleanup: needs verification.
- Whether DB-backed integration tests have recently run against live Postgres after the latest merged changes: needs verification.
