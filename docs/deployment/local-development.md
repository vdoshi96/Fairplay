# Local Development

Fairplay is a Next.js App Router app with Prisma and a Postgres-compatible database.

## Requirements

- Node.js `>=20.9.0`.
- npm.
- Docker with Docker Compose for local Postgres verification.

Docker is unavailable in the current implementation workspace, so DB-backed repository tests and end-to-end tests that require a live database were not run here. Run them in a Postgres-capable environment before production readiness.

## Install

```bash
npm install
```

## Environment

Copy the placeholder file and fill in local values outside source control:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL`: Postgres-compatible connection string. For local Docker, use values matching `compose.yaml`; for hosted environments, use the managed provider connection string.
- `SESSION_SECRET`: long random secret used for server-managed session signing/hashing flows. Generate a new value per environment.
- `AUTH_COOKIE_NAME`: defaults to `fairplay_session`.
- `APP_BASE_URL`: local app URL, usually `http://localhost:3000`.

AI Task Manager card generation uses Qwen for structured text and generated cover images styled after the current local Library cards. It needs the Qwen card key/model/base URL values plus `QWEN_IMAGE_API_KEY`, `QWEN_IMAGE_MODEL`, and `QWEN_IMAGE_BASE_URL`; it does not require ASR, OCR, audio, or upload variables. When `AI_PROVIDER_FALLBACK_ENABLED=true`, the Library generation path may use OpenAI text and image fallback variables.

Do not commit local env files, managed database credentials, plaintext passwords, seed real household records, or private reference materials.

## Local Postgres

Start the local Postgres service:

```bash
npm run db:up
npm run db:wait
```

The npm Prisma scripts include a fallback connection string for the Docker Compose service when `DATABASE_URL` is not set. For normal development, keep the same connection in `.env.local` so Next.js and Prisma use the selected local database consistently.

Stop the database when finished:

```bash
npm run db:down
```

## Prisma

Generate the Prisma client:

```bash
npm run prisma:generate
```

Validate the schema:

```bash
npm run prisma:validate
```

Apply local development migrations:

```bash
npm run prisma:migrate
```

Seed reviewed original demo content only:

```bash
npm run prisma:seed
```

Migrations currently live under:

- `prisma/migrations/20260504000000_init/`
- `prisma/migrations/20260504130000_add_radar_timing_fields/`

## Run The App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Verification

Run the docs-safe local checks before handing work off:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
npm run prisma:validate
```

`npm run test:e2e` uses Playwright. In this workspace, several protected-route flows are route-mocked because Docker/Postgres is unavailable; run DB-backed end-to-end coverage again in an environment with Postgres before production release.
