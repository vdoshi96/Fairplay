# Learned

## Planning Inputs

- The existing product artifacts are sufficient to decompose implementation without reopening private references.
- The gap review resolved several defaults that must be explicit in implementation tasks:
  - Add `/app/onboarding`.
  - Keep fixed persona keys and display names `alex`/`Alex` and `max`/`Max` for v1.
  - Treat persona-private drafts as server-persisted and persona-filtered UX records, not true secrecy from someone with the shared household credentials.
  - Use Argon2id, opaque server-managed sessions, idle and absolute expiration, logout revocation, and failed-login throttling.
  - Keep PWA work to responsive installability and metadata; do not cache sensitive household data offline.

## Decomposition Decisions

- Implementation should happen on a new app branch, likely `codex/v1-app`, with the docs/spec PR reviewed before or alongside the implementation PR.
- Tasks are mostly sequential because the same route tree will be extended by multiple feature slices. File ownership is still explicit for each task, with shared files identified as sequentially modified.
- The persistence task should create a local Postgres verification path, such as Docker Compose, so workers do not need Vercel cloud credentials to validate Prisma locally.
- The auth task should own password/session behavior and API routes, while auth UI is a separate task to keep sensitive server logic easier to review.
- Visual assets should remain gated on a visual-agent handoff; implementation workers should not invent source-adjacent character art or deck-like visual systems.

## Review Model

- Every implementation task should be followed by two reviews in order:
  1. Spec compliance review against product scope, user flows, data model, design spec, and IP/privacy/safety review.
  2. Code quality review for correctness, tests, accessibility, security, maintainability, and Vercel readiness.
