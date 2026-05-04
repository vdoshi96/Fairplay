# Handoff

## Status

Gap review is complete. Implementation planning can proceed with concerns noted, but no blocking contradiction was found.

## Do Before Task Decomposition

- Carry the implementation decisions in `gaps.md` into the implementation plan instead of leaving them as implicit choices.
- Include an explicit `/app/onboarding` route or rename the onboarding flow to an existing route.
- Decide whether custom persona display names are in v1. The conservative default is no.
- Define server-side behavior for persona-private radar drafts and make clear they are not true secrecy from someone with household credentials.
- Specify Argon2id, session expiration, logout, and failed-login defaults in the auth task.
- Keep PWA work limited to safe installability and responsive UX; do not cache sensitive household data offline in v1.

## Implementation Agents Must Preserve

- No production code should consult private `References/` materials.
- Do not add a source-like starter deck, copied category system, copied prompt set, copied assessment, workbook clone, or card/deck visual metaphor.
- Read `docs/product/ip-safety-review.md` before implementing copy, seed data, templates, prompts, auth/session behavior, radar, check-ins, metrics, or relationship-support flows.
- Do not add partner invites, individual accounts, export/deletion controls, paid features, or native iOS implementation unless a new task explicitly scopes them.

## Recommended Next Step

Create a separate implementation plan that decomposes v1 into auth/session, Prisma schema, domain services, JSON routes, UI flows, seed/demo review, PWA metadata, README/Vercel setup, and safety/IP copy review tasks.
