# Learned

- `package.json` already declares Node.js `>=20.9.0` and includes the required lint, typecheck, Vitest, Playwright, build, Prisma, and Docker Compose helper scripts.
- Local Postgres is defined in `compose.yaml`; Prisma scripts also include a local fallback `DATABASE_URL` for that compose service.
- Existing migrations are `20260504000000_init` and `20260504130000_add_radar_timing_fields`.
- No `vercel.json` exists; default Vercel Next.js framework detection is the minimal intended configuration for now.
