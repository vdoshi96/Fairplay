# Vercel Deployment

Fairplay is intended to deploy with Vercel's default Next.js framework detection. No `vercel.json` is required right now because the app does not need custom build, runtime, routing, or install configuration.

## Project Setup

1. Import the Git repository into Vercel.
2. Keep the default framework preset as Next.js.
3. Set the install command to Vercel's default npm install behavior.
4. Set the build command to `npm run build`.
5. Configure environment variables in Vercel Project Settings. Vercel stores project environment variables encrypted at rest.

Preview deployments should be created from non-production branches through Vercel Git integration. Production should deploy from the approved production branch after the readiness checklist passes.

## Environment Variables

Configure these values in Vercel Project Settings for Production, Preview, and Development as appropriate:

- `DATABASE_URL`: Postgres-compatible connection string from Vercel Marketplace storage or another selected managed Postgres provider.
- `SESSION_SECRET`: long random secret, unique per environment.
- `AUTH_COOKIE_NAME`: `fairplay_session` unless intentionally changed.
- `APP_BASE_URL`: canonical deployed URL for that environment.

Do not commit `.env`, `.env.local`, managed database credentials, real session secrets, plaintext passwords, seed real household records, or private reference materials. Keep private `References/` material out of the repository and out of deployment artifacts.

For local work against Vercel-managed variables, use the Vercel CLI only after the project is linked:

```bash
vercel env pull .env.local --yes
```

Review `.env.local` locally, but do not commit it.

## Database And Prisma

Provision Postgres-compatible storage through Vercel Marketplace or another approved managed Postgres provider, then set the resulting connection string as `DATABASE_URL`.

Before the first production deployment that serves real users, run migrations against the selected database:

```bash
npx prisma migrate deploy
```

Generate the Prisma client during local setup and verification:

```bash
npm run prisma:generate
```

Seed only reviewed original demo content, and never seed real household records:

```bash
npm run prisma:seed
```

## Sessions And Cookies

Household passwords must be hashed server-side and must never be stored, logged, seeded, or committed as plaintext. Set `SESSION_SECRET` outside source control with a long random value for each Vercel environment. Rotate it through Vercel Project Settings if it is ever exposed.

Fairplay session cookies are expected to be server-managed and configured as:

- `HttpOnly`.
- `Secure` in production.
- `SameSite=Lax`.
- Expiring with idle and absolute session limits.

Do not expose session material in browser storage or client-readable environment variables.

## Deploy Flow

Recommended flow:

1. Push the branch to GitHub and let Vercel create a preview deployment.
2. Run the readiness checklist below against the same commit and selected database.
3. Review preview behavior and logs.
4. Merge or promote only after checks pass and database migrations have run against the selected target.
5. Monitor production logs after release.

Manual CLI alternatives:

```bash
vercel deploy
vercel deploy --prod
```

## Readiness Checklist

Run these before production readiness sign-off:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
npm run prisma:validate
npx prisma migrate deploy
```

`npx prisma migrate deploy` must run with `DATABASE_URL` set to the selected target database. Docker is unavailable in the current implementation workspace, so DB-backed repository/e2e tests were not run here; run them in a Postgres-capable environment before production readiness.
