# Fairplay Architecture

Last updated: 2026-07-16

## Runtime Shape

Fairplay is a Next.js App Router application. Pages and route handlers live under `src/app/`. Protected app pages are wrapped by `src/app/app/layout.tsx`, which loads the current session view, redirects unauthenticated users, loads persona preferences, and renders `AppShell`.

`src/middleware.ts` rejects obviously anonymous `/app/**` requests, creates the per-request CSP nonce, applies browser protection headers, and enforces exact same-origin `Origin` values for cookie-authenticated unsafe methods. It never self-fetches or forwards cookies to a host-derived URL. Server rendering performs the authoritative session/persona load through `getAppSessionView()` and `getCurrentSession()`.

## Major Layers

### Routes

- Auth pages: `/login`, `/create-household`, `/choose-persona`.
- Primary app pages: `/app/your-cards`, `/app/distribute`, `/app/board`, `/app/ask-greg`.
- Secondary app pages: `/app/library`, `/app/check-ins`, `/app/check-ins/new`, `/app/check-ins/[id]`, `/app/crash-course`, `/app/onboarding`, `/app/responsibilities/new`, `/app/responsibilities/[id]`, `/app/settings`.
- Legacy compatibility routes: `/app/home` redirects to Deal and `/app/load-map` redirects to Board.
- API routes: auth, personas, preferences, responsibilities, load snapshot, card templates, AI card drafts, and check-ins.

### UI Components

`src/components/` is grouped by product surface:

- `app-shell`: navigation, page shell, session view, layout tokens.
- `auth`: forms, login/create/persona clients, auth page shell.
- `cards`: card-state mapping, route-specific Your Deck/Deal/Board workspaces, shared card presentation/pure transition helpers, and the responsibility detail sheet. A compatibility workspace export remains but is not imported by app routes.
- `library`: card library and AI task manager.
- `responsibilities`: responsibility editor; card distribution and board bucket mapping now live in `cards` plus server responsibility services.
- `check-ins`: lightweight schedule, confirmation, and notes flow.
- `crash-course` and `onboarding`: active learning and onboarding surfaces. The old feature-guide overlay/practice workflow has been removed. `welcome` remains as retired compatibility code and is not mounted in the protected app shell.
- `little-alex`, `settings`, `theme`, `visuals`, `motion`, `ui`: helper, preferences, theme, visual primitives, motion, and shared UI.

### Contracts And Domain

`src/contracts/` defines Zod schemas and TypeScript types for route payloads and client/server contracts. `src/domain/` owns stable enums, ids, load-signal calculations, visibility helpers, and time helpers. These are intended to stay platform-neutral for a possible future client.

### Server Services

`src/server/` separates business behavior from route handlers:

- `auth`: cookies, current session, password hashing, session token handling, throttling, bounded household-creation bodies, and bounded process-local creation attempts.
- `repositories`: Prisma read/write functions by aggregate.
- `responsibilities`, `check-ins`, `ai-card-drafts`: service-level behavior and tests.
- `ai`: provider selection, Qwen/OpenAI adapters, diagnostics, generated asset metadata.
- `db`: Prisma client and repository error helpers.

### Persistence

`prisma/schema.prisma` models households, credentials, personas, onboarding/Little Alex preferences, sessions, responsibilities, assignments, lifecycle notes, templates, AI card drafts, check-ins, compatibility check-in items/decisions, responsibility events, load snapshots, and auth throttling.

Migrations currently include initial schema, legacy Radar timing/removal history, personal-use redesign, cascade behavior, AI card drafts, and Little Alex preferences.

## Data Flow

1. Middleware establishes the document CSP/security headers and rejects cross-origin cookie mutations before route execution.
2. A user authenticates through `/api/auth/create-household` or `/api/auth/login`; household creation is size- and rate-limited before password hashing or persistence.
3. The server stores password/session state through repositories and sets an opaque session cookie.
4. The user selects a persona through `/api/personas/select`.
5. Protected pages load `getAppSessionView()`, then service/repository data for the current household/persona.
6. Responsibility overview reads reconcile the household source-card catalog only when its version marker is missing/stale, then load summary fields and current assignments. Card distribution calls server actions that route through `distributeResponsibilityCard()` and preserve stable persisted lane keys.
7. Other client components submit JSON to API route handlers.
8. Route handlers validate with Zod contracts and call service/repository layers.
9. Repositories persist through Prisma.
10. Pages/components refresh or navigate after successful mutation.

Card cover art flows from Library source templates into responsibility summaries as `sourceCoverAssetPath`. Deal, Your Deck, and Board all render from `responsibilityService.listOverview(session)` through their own client entry plus shared card primitives, so assignment movement and cover art stay consistent without cross-shipping all three views. Library and Deal represent the same source catalog; `templateId` is the stable card identity when present, and Board display is derived from assignment/categorization rather than duplicated card objects. The Board intentionally excludes the internal unassigned/dealable-pool bucket.

Generated page/auth backgrounds use local AVIF/WebP image sets with PNG fallback. Little Alex's Matter.js implementation is a desktop fine-pointer-only dynamic import; its runner pauses outside active motion and while the document is hidden.

## Verification Map

- Unit/component tests live beside source under `src/**/*.test.ts(x)`.
- Repository integration coverage includes `src/server/repositories/persistence.integration.test.ts`, which needs live Postgres.
- Playwright specs live in `e2e/`. Chromium owns the complete suite; desktop WebKit, iPhone WebKit, and touch Chromium own the mutation-based accessibility core flow, and touch Chromium also owns the mobile asset/bundle gate.
- `e2e/helpers/accessibility.ts` runs WCAG 2.0/2.1/2.2 A/AA Axe checks, fails every scoped violation, and attaches complete reports.
- Visual QA artifacts are generated under ignored `test-results/`.
- Prisma checks: `npm run prisma:validate`, `npm run prisma:generate`, migrations, and seed.

## Architecture Risks

- Board lane enum values are intentionally stable persisted keys; do not rename them without a dedicated compatibility migration.
- The card-first UI depends on the compatibility mapping and dedupe helpers in `src/components/cards/card-state.ts`; update tests and docs if persisted lanes or catalog identity ever migrate.
- Active household catalog responsibilities are protected by a partial `(householdId, templateId)` unique index. Migration/seed changes must preserve the distinction between duplicate rows for the same template and distinct source cards that happen to have similar titles.
- Built-in catalog changes must bump `FAIRPLAY_SOURCE_VERSION`; otherwise current household markers intentionally skip reconciliation.
- Household-creation throttling is bounded and process-local. Add an edge or shared datastore limiter if a multi-instance deployment requires coordinated global enforcement.
- Production cookies fail secure unless the local Playwright server explicitly opts into an HTTP-loopback exception; never set that flag for deployed origins.
- Some generated assets/prompts may reference retired surfaces: needs verification.
- `docs/agents/tasks/` is useful history but very large and not a concise onboarding layer.
- Full DB-backed behavior was verified locally after the Radar removal migration; production deployment should still run normal migration verification.
