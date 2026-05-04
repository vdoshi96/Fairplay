# Learned

- Vercel's current Next.js preset checks for a `build` script in `package.json` and uses it before falling back to `next build`; T10's no-`vercel.json` guidance is accurate for this app because there is no custom build, route, runtime, install, or output configuration.
- The deployment docs now intentionally distinguish local Prisma development migrations (`npm run prisma:migrate`) from managed-database release migrations (`npx prisma migrate deploy`).
- The `.env.example` file is placeholder-only, which is safer than including the Docker password in the example. The docs compensate by pointing local developers to `compose.yaml` for matching local database values.
- The only full-suite test failure is environmental: the DB-backed Prisma integration suite cannot reach `localhost:5432`, and Docker is not installed in the review workspace.
