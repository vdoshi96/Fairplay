# Learned

- The schema covers all named T03 entities and uses Prisma `postgresql`.
- Password storage is modeled as `passwordHash` plus hash metadata only; no plaintext password field is present.
- Session persistence stores `tokenHash`; no raw token field is present.
- Radar visibility/state and responsibility assignment history are explicit.
- Load snapshots contain aggregate distribution/count fields and no `score`, `winner`, `loser`, or `grade` fields.
- Seed behavior imports `DEMO_RESPONSIBILITY_TEMPLATES` from `src/seed/demo-content.ts` and upserts only that approved demo set.
- Static Next/TypeScript/Prisma checks pass without Docker.

