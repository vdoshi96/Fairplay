# Fairplay

Fairplay helps households make shared work visible, negotiable, and easier to maintain over time. The v1 app is a mobile-first Next.js App Router project with Prisma, Postgres-compatible persistence, server-managed sessions, Vitest, Playwright, ESLint, and Vercel deployment readiness.

## v1 Goal

The first version should support a small, practical household workflow:

- Define household responsibilities and expectations.
- Assign ownership with explicit handoffs and review points.
- Track current load and surface imbalances without blame-oriented language.
- Preserve enough history to support recurring check-ins.

## Requirements

- Node.js `>=20.9.0`.
- npm.
- Docker with Docker Compose for local Postgres verification.
- A Postgres-compatible database for DB-backed tests and deployed environments.

## Install

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` and replace placeholders with local or managed values:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL`: Postgres-compatible connection string. Use the Docker Compose database for local work or a Vercel Marketplace Postgres-compatible storage connection for deployed environments.
- `SESSION_SECRET`: long random secret for server-managed sessions. Use a different value per environment.
- `AUTH_COOKIE_NAME`: defaults to `fairplay_session`.
- `APP_BASE_URL`: app origin, such as `http://localhost:3000` locally.
- AI Task Manager card generation uses Qwen for text structuring and generated cover images styled after the current local Library cards. Configure `QWEN_CARD_API_KEY`, `QWEN_CARD_MODEL`, `QWEN_OPENAI_BASE_URL`, `QWEN_IMAGE_API_KEY`, `QWEN_IMAGE_MODEL`, and `QWEN_IMAGE_BASE_URL`; it does not require ASR, OCR, audio, or upload variables.
- Optional OpenAI fallback is enabled only when `AI_PROVIDER_FALLBACK_ENABLED=true`. The Library card-generation path can use `OPENAI_BASE_URL`, `OPENAI_TEXT_MODEL`, `OPENAI_TEXT_API_KEY`, `OPENAI_IMAGE_MODEL`, and `OPENAI_IMAGE_API_KEY`.

Environment variables must be configured outside source. Do not commit `.env`, `.env.local`, managed database credentials, real session secrets, plaintext passwords, seed real household records, or private reference materials.

## Local Development

Start local Postgres:

```bash
npm run db:up
npm run db:wait
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

Stop local Postgres:

```bash
npm run db:down
```

See [local development](docs/deployment/local-development.md) for the full Docker Compose and Prisma workflow.

## Commands

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
npm run docs:html
npm run docs:html:check
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Prisma migrations live in `prisma/migrations/`. Use `npm run prisma:migrate` for local development migrations. Use `npx prisma migrate deploy` against the selected managed database before production release.

Playwright tests run with `npm run test:e2e`. Some protected-route e2e flows are route-mocked in this workspace because Docker/Postgres is unavailable here; DB-backed repository and e2e tests must run in a Postgres-capable environment before production readiness.

## Documentation HTML Parity

Tracked project Markdown and other supported prose-documentation files are canonical. After adding or editing documentation, run `npm run docs:html` to deterministically regenerate the accessible same-directory `.html` counterpart for every source. Run `npm run docs:html:check` to verify completeness and exact generated-content parity; `npm run lint` and `npm test` run this check automatically through their lifecycle hooks.

The generator discovers only tracked or new non-ignored files through Git, refuses source/target collisions and hand-authored target overwrites, rewrites links between local documentation counterparts, escapes raw HTML and active URL schemes, and embeds the canonical source path and normalized SHA-256 in each generated page. LF normalization and `.gitattributes` keep output stable across platforms. It explicitly excludes private `References/`, ignored root `.superpowers/`, dependencies, builds, caches, and QA output. Tracked `docs/superpowers/` remains project-owned documentation and is included.

## Sessions And Cookies

Household passwords are created through the app and must be stored only as slow password hashes, never as plaintext. Set `SESSION_SECRET` outside source control with a long random value. Fairplay session cookies are expected to be server-managed and configured as `HttpOnly`, `Secure` in production, and `SameSite=Lax`, with idle and absolute expiration. Do not store session secrets, household records, private drafts, or concern details in browser storage.

## Vercel Deployment

Fairplay uses Vercel's default Next.js behavior. No `vercel.json` is currently needed because the app does not require custom runtime, build, route, or install settings.

Configure `DATABASE_URL`, `SESSION_SECRET`, `AUTH_COOKIE_NAME`, and `APP_BASE_URL` in Vercel Project Settings. Vercel stores project environment variables encrypted at rest. Use a Vercel Marketplace Postgres-compatible storage connection for `DATABASE_URL`, then run:

```bash
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
```

Recommended deploy flow:

1. Push a branch and review the Vercel preview deployment.
2. Run the readiness checklist against the same commit.
3. Run migrations against the selected database.
4. Promote or merge to production only after checks and review pass.

See [Vercel deployment](docs/deployment/vercel.md) for details.

## Vercel Readiness Checklist

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
npm run prisma:validate
npx prisma migrate deploy
```

`npx prisma migrate deploy` must run with `DATABASE_URL` set to the selected target database. Docker is unavailable in the current implementation workspace, so DB-backed repository/e2e tests were not run here; they must run in a Postgres-capable environment before production readiness.

## Reference Material Policy

Private reference materials in `References/` are excluded from git. These files may inform future product thinking only after an IP-safety review, and no source text, cards, exports, PDFs, EPUBs, or spreadsheets should be copied into the repository unless they are already intentionally tracked and cleared for use.
