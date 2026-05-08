# Fairplay Wiki

Last updated: 2026-05-08

## System Summary

Fairplay is a Next.js App Router household planning app with Prisma/Postgres persistence, server-managed household sessions, persona-aware app state, a mobile-first card app shell, image-first Your Deck/Deal/Board/Ask Greg primary tabs, lightweight check-in records, learning flows, settings, and Little Alex helper preferences.

## Wiki Pages

- `architecture.md`: current app architecture, data flow, service boundaries, and verification map.
- `file-map.md`: practical repo index, source directories, docs/assets inventory, and `needs verification` areas.

## High-Level Feature Map

- Auth and session: household create/login/logout/me, persona selection, middleware protection, server session refresh.
- Card workflow: Your Deck searchable assigned-card gallery, Deal swipe deck plus available-card list, Board bucket sections, Ask Greg card generation.
- Learning: Theory, feature guides, onboarding.
- Responsibilities: stable persisted lanes, product bucket mapping, assignment/status/visibility/placement routes, simplified card detail.
- Library: template cards with flip-to-back details and direct lane assignment.
- Check-ins: schedule a check-in, confirm it happened, and save optional minutes/notes.
- Settings: theme mode, persona/Little Alex settings, logout, and crash-course restart.

## Important Context Links

- `../context/PROJECT.md`: durable product and technical summary.
- `../context/STATUS.md`: current status and cleanup candidates.
- `../context/DECISIONS.md`: durable architecture/product decisions.
- `../context/SOURCES.md`: source policy and consulted materials.
- `../product/ip-safety-review.md`: blocking IP/privacy/safety guide.
- `../product/visual-system.md`: visual and motion direction.
- `../deployment/local-development.md`: local DB and verification workflow.
- `../agents/manifest.md`: historical agent task registry.
- `../product/card-first-mobile-redesign.md`: current card-first redesign rationale, IA, state model, gestures, PWA notes, QA, limitations, and future work.
- `../implementation/2026-05-08-mobile-card-ui-state-fix.md`: mobile card UI/state fix report, changed files, state flow, PR order, and QA notes.

## Current Cleanup Priority

1. Inventory generated assets for live usage after the Radar asset removal.
2. Separate current docs from historical agent logs.
3. Complete manual iOS Add to Home Screen verification before production release.
4. Revisit board lane enum renames only as a dedicated compatibility migration.
