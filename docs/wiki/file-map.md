# Fairplay File Map

Last updated: 2026-07-16

This is a practical index, not a reorganization plan.

## Root

- `README.md`: install, env, commands, sessions, Vercel, readiness checklist, reference policy.
- `package.json`: npm scripts and dependencies.
- `package-lock.json`: npm lockfile.
- `.env.example`: placeholder env values for DB, sessions, Qwen, and optional OpenAI fallback.
- `.gitignore`: ignores env files, builds, coverage, Playwright output, `.worktrees/`, `.superpowers/`, `.DS_Store`, and `References/`.
- `compose.yaml`: local Postgres service.
- `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `playwright.config.ts`: framework, lint, styling, test, and e2e config.
- `next-env.d.ts`, `tsconfig.tsbuildinfo`: generated TypeScript/Next files. `tsconfig.tsbuildinfo` is ignored and needs cleanup if committed accidentally.

## App Source

- `src/app/layout.tsx`: root metadata, font, theme init script, global provider.
- `src/app/page.tsx`: redirects users to login, persona selection, or Deal.
- `src/app/(auth)/`: auth route pages.
- `src/app/app/layout.tsx`: protected app layout and app shell wrapper.
- `src/app/app/home/page.tsx`: legacy redirect to Deal.
- `src/app/app/your-cards/page.tsx`: Your Deck, a searchable image-first assigned-card gallery for the selected persona.
- `src/app/app/distribute/page.tsx`: Deal, a searchable swipe deck with an available-card list.
- `src/app/app/board/page.tsx`: grouped image-first card bucket board.
- `src/app/app/ask-greg/page.tsx`: card generation/advisor surface.
- `src/app/app/load-map/page.tsx`: legacy redirect to Board.
- `src/app/app/library/page.tsx`: library and AI draft page.
- `src/app/app/check-ins/`: check-in list/new/detail pages.
- `src/app/app/crash-course/page.tsx`: immersive crash-course route.
- `src/app/app/onboarding/page.tsx`: onboarding page.
- `src/app/app/responsibilities/`: responsibility create/detail pages.
- `src/app/app/settings/page.tsx`: settings page.
- `src/app/api/`: JSON route handlers for auth, personas, preferences, responsibilities, load snapshot, card templates, AI drafts, and check-ins.
- `src/app/globals.css`: ordered global-style entrypoint; `src/app/styles/` owns Tailwind boundaries, tokens/theme, shell/background, motion, Little Alex, and reduced-motion layers.
- `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/manifest.ts`: PWA metadata/assets.

## Components

- `src/components/app-shell/`: desktop/sidebar/mobile nav shell, page shell, session view.
- `src/components/auth/`: create/login/persona UI and auth helpers.
- `src/components/cards/`: card state mapping, route-specific Board/Deal/Your Deck workspaces, compatibility workspace export, shared card cover/back presentation, pure search/transition helpers, household work map, and responsibility detail sheet.
- `src/components/library/`: card library and AI Task Manager.
- `src/components/responsibilities/`: responsibility editor.
- `src/components/check-ins/`: check-in flow.
- `src/components/crash-course/`: crash course content, scene, and flow.
- `src/components/onboarding/`: onboarding flow and client page.
- `src/components/little-alex/`: desktop fine-pointer loader plus lazy Matter.js helper/avatar physics.
- `src/components/settings/`: settings panel.
- `src/components/theme/`: theme provider and constants.
- `src/components/ui/`: shared UI primitives.
- `src/components/visuals/`: generated/inline Fairplay visuals.
- `src/components/motion/`: shared motion primitives.
- `src/components/welcome/`: retired persistent welcome compatibility UI; not mounted in the protected app shell.

## Domain, Contracts, Server

- `src/contracts/`: Zod contracts for auth, personas, preferences, responsibilities, check-ins, card templates, AI drafts, and Little Alex.
- `src/domain/`: ids, enums, visibility helpers, load signals, and time helpers.
- `src/lib/`: formatting and safety copy.
- `src/seed/`: demo content and source-card seed data. Name/source policy needs verification before expanding.
- `src/server/auth/`: cookies, session current-state, token handling, password hashing, throttling.
- `src/server/db/`: Prisma client and repository error helpers.
- `src/server/repositories/`: Prisma repository functions.
- `src/server/responsibilities/`: responsibility service and load snapshot.
- `src/server/check-ins/`: check-in scheduling/completion service plus compatibility item/decision logic.
- `src/server/ai-card-drafts/`: AI draft service.
- `src/server/ai/`: AI provider adapters, diagnostics, generated asset metadata.
- `src/test/`: shared test setup and factories.

## Database

- `prisma/schema.prisma`: full Prisma schema.
- `prisma/migrations/`: migration SQL and lock file.
- `prisma/seed.ts`: seed entrypoint.

## Tests

- `src/**/*.test.ts(x)`: Vitest unit/component/service/route/repository tests.
- `src/server/repositories/persistence.integration.test.ts`: DB-backed integration test requiring Postgres.
- `e2e/*.spec.ts`: Playwright tests for auth/onboarding, check-ins, retired feature-guide absence, visual responsive behavior, root redirects, Little Alex, Board, legacy Load Map compatibility, and mobile bundle/asset delivery.
- `e2e/helpers/`: Playwright helper utilities.

## Docs

- `docs/context/`: durable memory created by this pass.
- `docs/wiki/`: compiled project wiki created by this pass.
- `docs/product/`: product scope, data model, flows, IP/privacy/safety review, visual system.
- `docs/deployment/`: local development, release checklist, Vercel notes.
- `docs/helper-system/`: Little Alex architecture, assets, QA, and handoff.
- `docs/implementation/`: implementation notes and task logs.
- `docs/research/`: paraphrased research reports.
- `docs/superpowers/`: specs, plans, and outcomes.
- `docs/agents/`: large historical agent task registry and work logs.

## Assets And Scripts

- `public/assets/fairplay/cards/`: card cover assets.
- `public/assets/fairplay/generated-ui/`: generated backgrounds, crash-course art, historical feature-guide art, and illustrations. Retired Radar generated entries/assets have been removed.
- `public/assets/fairplay/little-alex-sprites/`: Little Alex generated sprites and manifests.
- `scripts/db/wait-for-db.mjs`: local DB wait helper.
- `scripts/generate-responsive-image-variants.mjs`: deterministic AVIF/WebP background variant generation.
- `scripts/generate-*.mjs`: other asset generation scripts.

## Ignored/Local Areas

- `node_modules/`: installed dependencies.
- `.next/`: generated Next build/dev output.
- `.vercel/`: Vercel local metadata.
- `.worktrees/`: local implementation worktrees.
- `.superpowers/`: local superpowers state.
- `test-results/`: Playwright and visual QA artifacts.
- `References/`: private local reference materials, ignored by git.
- `.env.local`: local secrets/config, ignored by git and not read in this pass.

## Needs Verification

- Deprecated `/api/ai-card-drafts/[id]/regenerate-image` route and AI media columns.
- `src/seed/fairplay-source-cards.ts` naming and content provenance before expanding templates.
- Browser storage audit beyond theme-only `localStorage`; household/private/secrets storage remains prohibited.
- Local ignored `.DS_Store` files and `tsconfig.tsbuildinfo` cleanup.

## Board Lane Compatibility Note

- `ResponsibilityBoardLane` values are persisted API/database keys. Keep `cards_of_concern`, `player_1`, `player_2`, and `kid_split` stable unless a later PR performs an explicit compatibility migration.
- User-facing labels, help text, and lane conversion helpers live in `src/components/cards/card-state.ts`.
