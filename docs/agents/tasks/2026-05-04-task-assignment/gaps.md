# Gaps

## Remaining Context Needs For Implementation

- A visual/asset agent still needs to produce original character, illustration, icon, and motion direction before the visual integration task can proceed beyond UI hooks and existing CSS motion.
- The exact Vercel Marketplace Postgres provider is not chosen. Implementation can proceed with generic `DATABASE_URL` and local Postgres, then document provider-specific setup once selected.
- Final safety-reviewed onboarding copy is not separately approved beyond the guardrails in current product docs. The implementation plan requires spec compliance review before user-facing copy ships.
- Public-launch data controls such as export, deletion, household exit, and access revocation remain post-v1 or pre-scale privacy work and must not be silently added to v1.

## Non-Blocking Implementation Defaults

- Use Node.js 20.9 or newer.
- Use `create-next-app@latest` with App Router, TypeScript, ESLint, Tailwind CSS, and the `src/` directory.
- Use Prisma with provider `postgresql`.
- Use local Postgres through Docker Compose for non-cloud verification.
- Use Argon2id with versioned parameters and server-managed opaque sessions.
- Use the tiny original seed/demo areas and examples already listed in product docs, with `approved_original` review status only.
