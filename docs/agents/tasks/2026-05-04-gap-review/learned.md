# Learned

## Overall Readiness

Fairplay v1 is mostly ready for implementation planning. The artifacts converge on a mobile-first Next.js App Router app with TypeScript, Tailwind CSS, Prisma, Postgres-compatible managed storage through Vercel Marketplace, shared household credentials, Alex/Max persona selection, durable responsibility records, radar items, guided check-ins, aggregate load snapshots, and platform-neutral JSON contracts for future iOS compatibility.

No contradiction appears severe enough to stop implementation decomposition. The remaining risks are mostly default choices and product-boundary clarifications that should be handled before or during the implementation plan.

## Resolved From Earlier Research

- V1 should not ship a full source-like starter library, card deck, copied worksheet, assessment, or source-derived taxonomy.
- V1 can include user-authored responsibilities and a tiny reviewed demo set with original area names and invented examples.
- Shared ownership is represented through assignment roles, not as a separate responsibility status.
- Load signals are aggregate household summaries, not partner scores.
- The first identity model is one shared household username/password plus Alex/Max persona selection, not individual user accounts.
- Future iOS compatibility is covered by UUIDs, stable string enums, ISO timestamps, explicit JSON contracts, and platform-neutral domain services.

## Review Notes

- The product docs correctly repeat the non-clinical boundary and unsafe-relationship cautions.
- IP constraints are actionable for implementation agents: avoid source copy, source-like catalog size, source-derived categories, copied prompt structures, and card/deck visual metaphors.
- Privacy constraints are actionable but need exact implementation defaults for hashing, session expiration, failed-login protection, and server-side draft persistence.
- The app should treat persona-private drafts as a UX visibility boundary. Because credentials are shared and persona switching is possible, product copy must not describe those drafts as cryptographically secret from the household.
- Partner invite flows appear intentionally out of scope for v1. Implementation should not add invites during decomposition unless a new product review is assigned.
