# Fairplay Decisions

Last updated: 2026-07-16

## Decision Log

| Date | Decision | Rationale | Status |
| --- | --- | --- | --- |
| 2026-07-16 | Enforce one middleware-owned nonce CSP and same-origin checks for cookie-authenticated mutations; keep production cookies secure unless an explicit HTTP-loopback QA opt-in is active. | Browser security policy must match App Router scripts without inline-policy drift, and local WebKit verification must not create a production cookie downgrade path. | Accepted |
| 2026-07-16 | Bound household-creation bodies and process-local attempts before Argon2 or database work, committing client/global quota only when both gates allow. | Expensive unauthenticated work needs predictable resource limits, privacy-preserving client keys, bounded memory, and isolation so one rejected client cannot consume another client's capacity. | Accepted; shared multi-instance limiting remains an infrastructure option |
| 2026-07-16 | Gate releases with one real mutation workflow across Chromium, WebKit, iPhone WebKit, and touch Chromium, failing every scoped WCAG A/AA Axe violation. | Navigation-only smoke tests and severity filtering could miss engine-specific persistence, touch, nonce, and standards failures. | Accepted |
| 2026-07-16 | Gate household catalog reconciliation by a marker written after success, use current-assignment summary reads, and throttle session activity persistence to five-minute intervals. | Routine page reads should not upsert a stable catalog, load historical detail payloads, or rewrite session activity repeatedly; nullable/version-last and conditional-write behavior keep migration, retry, revocation, and expiration semantics safe. | Accepted |
| 2026-07-16 | Ship route-specific Board/Deal/Deck clients, fine-pointer-gated Little Alex physics, responsive local artwork, and ordered global CSS layers. | The primary routes should not cross-ship unrelated views or mobile physics, and decorative artwork should use modern responsive formats while retaining local fallbacks and the established visual cascade. | Accepted |
| 2026-07-16 | Use one accessible modal primitive for destructive/ownership confirmations, optimistic single-flight Deal transitions, and ownership-safe Board move menus. | Focus isolation and restoration make confirmations dependable; single-flight optimistic state keeps Deal responsive without stale rollback; assigned cards must change owners through the explicit agreement instead of a shortcut. | Accepted |
| 2026-07-16 | Keep household equity descriptive and route every existing-owner change through one revision-guarded ownership agreement. | Counts make hidden and due work visible without scoring partners; a row-locked agreement preserves helpers/backups, requires an explicit former-owner handoff, and derives shared presentation without changing persisted lane values. | Accepted |
| 2026-05-08 | Make cards the primary product surface and retire the homepage. | The user requested a full mobile-first product rethink around card distribution; direct action beats a learning/dashboard landing page. | Accepted |
| 2026-05-08 | Treat Library and Deal as the same source catalog, with assignment/status stored separately. | The user rejected the put-in-play workflow and duplicate card instances; source template identity should be stable while Board display is derived from assignment/categorization. | Accepted |
| 2026-05-08 | Enforce one active household responsibility per source template. | A partial unique index plus duplicate archival migration prevents repeated Library/Deal actions from creating duplicate catalog cards while preserving distinct source cards with similar titles. | Accepted |
| 2026-05-08 | Keep persisted board-lane keys but normalize product buckets in the UI/service layer. | Avoids a database compatibility migration while enabling `unassigned`, `alex`, `max`, `savedForLater`, and `notApplicable` behavior. | Accepted |
| 2026-05-08 | Rename visible card standards copy to Fogging Estandards. | The user explicitly requested the new label and removal of old minimum-standard card-detail clutter. | Accepted |
| 2026-05-08 | Make Little Alex desktop-only. | Mobile touch scrolling and dragging compete too often; preserving mobile scroll is more important than forcing a novelty interaction on touch-first layouts. | Accepted |
| 2026-05-08 | Retire the feature-guide and dummy practice workflow. | The current card-first app is simple enough without extra "Learn this feature" launchers, and the dummy Library/Settings practice flows added maintenance cost without improving the core path. | Accepted |
| 2026-05-08 | Use PWA/safe-area metadata and fixed mobile bottom tabs for the core app shell. | Mobile Safari and Add to Home Screen are primary targets for this redesign. | Accepted |
| 2026-05-07 | Add standard repo memory and wiki files without reorganizing source files. | The repo organization is haphazard, and future agents need a reliable index before feature work or cleanup. | Accepted |
| 2026-05-07 | Treat this as repo-level project memory, not global memory. | The facts are specific to Fairplay's product, codebase, source policy, and current architecture. | Accepted |
| 2026-05-07 | Mark unclear/dead/suspicious areas as `needs verification`. | The user explicitly asked not to guess, and several legacy pieces may be compatibility code. | Accepted |
| 2026-05-07 | Retire Radar as an active product/backend area. | The cleanup branch removed Radar API routes, server services, contracts, model links, and generated assets after the UI had already been retired. | Accepted; local DB-backed verification passed |
| 2026-05-07 | Keep board lane enum values stable for now. | `cards_of_concern`, `player_1`, `player_2`, and `kid_split` are persisted API/database keys; the UI already maps them to user-facing labels. Renaming belongs in a separate compatibility migration. | Accepted |
| 2026-05-07 | Treat device theme persistence in `localStorage` as allowed non-sensitive UI state. | Later interaction-upgrade docs explicitly permit theme mode in `localStorage`; older release scans are stale. | Accepted, but audit sensitive storage separately |
| 2026-05-07 | Keep generated cover art in AI card draft success path. | Latest AI card image generation handoff says ready drafts require generated text and cover bytes. | Accepted |
| 2026-05-07 | Use Qwen as primary AI generation provider with optional OpenAI fallback. | README and env example define Qwen primary variables and fallback gated by `AI_PROVIDER_FALLBACK_ENABLED`. | Accepted |
| 2026-05-04 | Use Next.js App Router, TypeScript, Tailwind CSS, Prisma, Postgres-compatible storage, and Vercel deployment readiness. | Existing product architecture docs chose a conservative typed web stack and Vercel-compatible persistence. | Accepted |
| 2026-05-04 | Use shared household credentials with post-login Alex/Max persona selection. | V1 targets low-friction household planning while avoiding claims of per-person secrecy. | Accepted |
| 2026-05-04 | Use server-managed sessions and slow password hashing. | Privacy/security baseline requires opaque session cookies, expiration, logout, auth throttling, and no plaintext passwords. | Accepted |
| 2026-05-04 | Keep IP/safety constraints blocking for user-facing copy, seed data, templates, prompts, visuals, auth/session, and relationship-support flows. | Fairplay must not copy private references or become a therapy, scoring, or unsafe-confrontation tool. | Accepted |

## Naming And Compatibility Notes

- Database and contract board lane enums intentionally keep persisted keys such as `cards_of_concern`, `player_1`, `player_2`, and `kid_split`; use UI label mapping for display and defer any rename to a dedicated migration.
- Platform-neutral card bucket/lane contracts live in `src/domain/card-distribution.ts`, with compatibility and UI-only presentation helpers retained in `src/components/cards/card-state.ts`; `unassigned` remains an internal dealable-pool bucket.
- Catalog card identity is `Responsibility.templateId` when present. Do not dedupe source cards by title; there are intentional same-title variants such as Alex/Max source cards.
- Deprecated AI routes and media fields may be compatibility scaffolding: needs verification before removal.
