# Local Development

Fairplay is a Next.js App Router app with Prisma and a Postgres-compatible database.

## Requirements

- Node.js `>=20.9.0`.
- npm.
- A local or hosted Postgres-compatible database.
- Docker with Docker Compose is optional for the default local Postgres service.

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
- `SHADOW_DATABASE_URL`: separate empty Postgres database used by `prisma migrate dev`. For local Docker defaults, use `postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay_shadow?schema=public`.
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

The npm Prisma scripts include fallback connection strings for the Docker Compose service when `DATABASE_URL` or `SHADOW_DATABASE_URL` is not set. For normal development, keep the same connections in `.env.local` so Next.js and Prisma use the selected local database consistently.

The Compose service creates both `fairplay` and `fairplay_shadow` for fresh volumes. If you are using an existing local Postgres where the app user cannot create databases, run the helper once:

```bash
npm run db:shadow
```

The helper checks `SHADOW_DATABASE_URL`, creates the shadow database when possible, and falls back to the local OS Postgres admin connection for localhost setups.

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

`npm run prisma:migrate` runs `npm run db:shadow` first so Prisma does not need to create its own shadow database with the application role.

Seed reviewed original demo content only:

```bash
npm run prisma:seed
```

Migrations currently live under:

- `prisma/migrations/20260504000000_init/`
- `prisma/migrations/20260504130000_add_radar_timing_fields/` (legacy migration history)
- `prisma/migrations/20260507120000_remove_radar/`

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

`npm run test:e2e` builds the app first and then uses Playwright against `next start` on port 3101. The Playwright web server injects local default `DATABASE_URL`, `SHADOW_DATABASE_URL`, `SESSION_SECRET`, and `APP_BASE_URL` values so the local production server behaves like a real runtime instead of depending on the developer shell.
