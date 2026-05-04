# Handoff

## Current State

Fairplay v1 product architecture is now captured in documentation. The product artifacts define scope, flows, data entities, stack direction, platform-neutral API expectations, seed/demo boundaries, and IP/privacy/relationship-safety guardrails.

## Decisions to Preserve

- V1 is a mobile-first PWA-friendly Next.js web app deployable to Vercel and architected for future iOS.
- The data foundation is Postgres-compatible managed storage through Vercel Marketplace with Prisma as the chosen ORM.
- Authentication uses one household username/password, secure password hashing, server-managed sessions, and post-login persona selection between Alex and Max.
- Product vocabulary must stay original and neutral: responsibilities, load map, radar, check-ins, decisions, visibility, and review timing.
- V1 avoids a source-like card deck, public Better Share copy/UI, copied assessment language, source taxonomy, and source visuals.
- Demo seed data is allowed only as a tiny, invented, reviewed set of original categories/examples.

## Next Agent Guidance

- Read `docs/product/ip-safety-review.md` before writing any user-facing copy, prompts, seed data, auth/session logic, concern flow, or check-in flow.
- Do not implement from private reference materials directly.
- Keep shared domain contracts platform-neutral and usable by future iOS clients.
- If implementation begins later, create a separate implementation plan; this task intentionally stops at architecture/spec synthesis.
