# Fairplay Decisions

Last updated: 2026-05-07

## Decision Log

| Date | Decision | Rationale | Status |
| --- | --- | --- | --- |
| 2026-05-07 | Add standard repo memory and wiki files without reorganizing source files. | The repo organization is haphazard, and future agents need a reliable index before feature work or cleanup. | Accepted |
| 2026-05-07 | Treat this as repo-level project memory, not global memory. | The facts are specific to Fairplay's product, codebase, source policy, and current architecture. | Accepted |
| 2026-05-07 | Mark unclear/dead/suspicious areas as `needs verification`. | The user explicitly asked not to guess, and several legacy pieces may be compatibility code. | Accepted |
| 2026-05-07 | Keep Radar backend references documented instead of deleting them. | Recent product cleanup retired the Radar UI, but code still supports check-ins, responsibilities, APIs, and schema references. | Needs verification |
| 2026-05-07 | Treat device theme persistence in `localStorage` as allowed non-sensitive UI state. | Later interaction-upgrade docs explicitly permit theme mode in `localStorage`; older release scans are stale. | Accepted, but audit sensitive storage separately |
| 2026-05-07 | Keep generated cover art in AI card draft success path. | Latest AI card image generation handoff says ready drafts require generated text and cover bytes. | Accepted |
| 2026-05-07 | Use Qwen as primary AI generation provider with optional OpenAI fallback. | README and env example define Qwen primary variables and fallback gated by `AI_PROVIDER_FALLBACK_ENABLED`. | Accepted |
| 2026-05-04 | Use Next.js App Router, TypeScript, Tailwind CSS, Prisma, Postgres-compatible storage, and Vercel deployment readiness. | Existing product architecture docs chose a conservative typed web stack and Vercel-compatible persistence. | Accepted |
| 2026-05-04 | Use shared household credentials with post-login Alex/Max persona selection. | V1 targets low-friction household planning while avoiding claims of per-person secrecy. | Accepted |
| 2026-05-04 | Use server-managed sessions and slow password hashing. | Privacy/security baseline requires opaque session cookies, expiration, logout, auth throttling, and no plaintext passwords. | Accepted |
| 2026-05-04 | Keep IP/safety constraints blocking for user-facing copy, seed data, templates, prompts, visuals, auth/session, and relationship-support flows. | Fairplay must not copy private references or become a therapy, scoring, or unsafe-confrontation tool. | Accepted |

## Naming And Compatibility Notes

- Database and contract enums include legacy/product-specific names such as `cards_of_concern`, `player_1`, `player_2`, and `kid_split`: needs verification before rename because migrations and persisted records may depend on them.
- Radar models and routes remain after UI retirement: needs verification before removal because check-ins and responsibility flags still reference radar items.
- Deprecated AI routes and media fields may be compatibility scaffolding: needs verification before removal.
