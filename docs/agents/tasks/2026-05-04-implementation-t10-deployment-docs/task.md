# T10 README Deployment Instructions And Vercel Readiness

## Scope

Implementation worker T10 updates deployment and local-development documentation for the Fairplay v1 app.

## Ownership

- Modify `README.md`.
- Modify `.env.example`.
- Create `docs/deployment/vercel.md`.
- Create `docs/deployment/local-development.md`.
- Do not create `vercel.json` unless custom Vercel behavior is required.
- Update agent manifest and controller log.

## Guardrails

- Do not touch feature implementation files under `src/server/**`, `src/app/**`, `src/components/**`, or `prisma/schema.prisma`.
- Do not consult or copy private `References/` files.
- Keep `.env.example` placeholder-only.
- Document that no private reference materials, plaintext passwords, seed real household records, managed database credentials, real session secrets, or local env files may be committed.
- Record the current Docker/Postgres limitation honestly.
