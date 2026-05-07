# Fairplay Wiki

Last updated: 2026-05-07

## System Summary

Fairplay is a Next.js App Router household planning app with Prisma/Postgres persistence, server-managed household sessions, persona-aware app state, a mobile-first app shell, a responsibility Load Map, Library/AI draft generation, guided check-ins, learning flows, settings, and Little Alex helper preferences.

## Wiki Pages

- `architecture.md`: current app architecture, data flow, service boundaries, and verification map.
- `file-map.md`: practical repo index, source directories, docs/assets inventory, and `needs verification` areas.

## High-Level Feature Map

- Auth and session: household create/login/logout/me, persona selection, middleware protection, server session refresh.
- Home and learning: Home learning hub, crash course, feature guides, persistent welcome.
- Load Map and responsibilities: board lanes, filters, drag/drop, assignment/status/visibility/placement routes, detail editor.
- Library: template cards, AI draft tracker, generated cover retrieval, put-in-play flow.
- Check-ins: agenda preview, create/resume/complete, item updates, decisions, summaries.
- Settings: theme mode, persona/Little Alex settings, logout, welcome replay, crash-course restart.

## Important Context Links

- `../context/PROJECT.md`: durable product and technical summary.
- `../context/STATUS.md`: current status and cleanup candidates.
- `../context/DECISIONS.md`: durable architecture/product decisions.
- `../context/SOURCES.md`: source policy and consulted materials.
- `../product/ip-safety-review.md`: blocking IP/privacy/safety guide.
- `../product/visual-system.md`: visual and motion direction.
- `../deployment/local-development.md`: local DB and verification workflow.
- `../agents/manifest.md`: historical agent task registry.

## Current Cleanup Priority

1. Verify legacy board lane names and migration impact.
2. Inventory generated assets for live usage after the Radar asset removal.
3. Separate current docs from historical agent logs.
4. Complete live persisted browser-flow verification before production release.
