# Corrective Pass Root Cause And Strategy

## Context Read

Before implementation, the orchestrator and read-only explorers reviewed the current repository state, all current markdown inventories, prior 2026-05-07 workstream docs, product docs, book reports, helper-system notes, deployment notes, generated asset notes, and high-signal implementation history. The most relevant prior files are:

- `docs/agents/tasks/2026-05-07-fairplay-ux-reliability-integration/final-implementation-report.md`
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/`
- `docs/agents/tasks/2026-05-07-crash-course-redesign/`
- `docs/agents/tasks/2026-05-07-home-loadmap-refresh/`
- `docs/agents/tasks/2026-05-07-learner-sandbox-flows/`
- `docs/agents/tasks/2026-05-07-library-action-reliability/`
- `docs/research/fair-play-book-report.md`
- `docs/research/a-better-share-book-report.md`
- `References/fair-play-book-report.md`
- `References/a-better-share-book-report.md`
- `docs/product/visual-system.md`
- `docs/product/user-flows.md`

## Corrective Root Causes

### Responsive Shell

The protected layout still splits spacing responsibilities across `AppShell`, `PageShell`, Little Alex physics bounds, and page-local hero/card wrappers. There are no shared tokens for sidebar width, bottom nav height, safe-area padding, or Little Alex reservation. That is why learner buttons and the character drift relative to bottom navigation and desktop sidebars.

### Page Backgrounds

The previous pass placed generated backgrounds inside individual hero cards or workbench panels. This made art disappear behind cards and left the page itself reading as a plain beige canvas. A reusable page-level background system is needed so backgrounds scale with the viewport instead of local card dimensions.

### Load Map

Load Map received visual polish but retained a high-scroll board-first structure. Filters remain stacked, diagnostic values can clip, and the lane scroller dominates smaller viewports. This needs a dashboard redesign, not more local padding.

### AI Draft Generation

The prior reliability fix decoupled provider config, but the product pipeline still made text drafts depend on image generation. `ready` still meant text plus generated cover, `Put in play` required cover bytes, and the UI used one global pending action. A failed image stage could still make text generation appear broken and could leave requests awkwardly stuck.

### Crash Course

The prior rewrite covered source concepts, but it stayed as ten passive lessons and did not fully solve the image/text separation on short viewports. The corrective course should become a shorter conceptual primer with final-section-only app learning path.

### Player Labels

Internal enum values `player_1` and `player_2` are expected and should remain. Remaining user-facing `Player 1` / `Player 2` text is in seeded source-card display content, which renders in Library and detail surfaces.

## Branch Strategy

- `codex/layout-background-corrective`: shared shell tokens, page backgrounds, guide action placement, Little Alex safe areas, homepage learner button cleanup.
- `codex/load-map-dashboard-corrective`: Load Map dashboard overhaul, compact filters, diagnostics, lane usability.
- `codex/text-only-card-generation`: text-only independent AI card requests, no image/audio dependencies in card generation, request-detail UX, save/retry/cancel.
- `codex/crash-content-labels-corrective`: five-beat Crash Course rewrite/layout and user-facing Player label cleanup.
- `codex/fairplay-corrective-pass-integration`: merge branch, cross-workstream docs, final QA, PR source.

## Rollback Guidance

Each workstream branch should be merged with a merge commit. If a workstream causes regression before final PR merge, revert the matching merge commit on the integration branch. After merge to `main`, use normal revert commits.

High-risk rollback areas:

- Text-only AI: service/repository/contract/UI changes around AI drafts.
- Layout shell: `AppShell`, `PageShell`, global CSS tokens, Little Alex bounds.
- Load Map: `ResponsibilityLoadMap` dashboard structure.
- Crash/content labels: crash course lesson array and seed display labels.

## QA Expectations

Final integration must run focused branch tests, full unit suite, typecheck, lint, build, Playwright e2e, and responsive visual checks across Home, Load Map, Library, Radar, Check-ins, Settings, and Crash Course.

Visual checks must cover mobile, tablet/small desktop, normal desktop, and short-height viewports. Required findings: no horizontal overflow, no clipped filter controls, no huge unexplained whitespace, no controls hidden behind bottom nav, Little Alex fully visible, learner buttons aligned, Crash Course image/text connected, background visible/readable, Load Map usable, and AI failed requests not blocking later requests.
