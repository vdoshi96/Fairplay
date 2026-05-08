# Card-First Mobile Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Fairplay as a mobile-first responsibility-card app centered on swipe distribution, card ownership, a bucketed board, and Ask Greg.

**Architecture:** Keep the Next.js App Router, Prisma schema, and existing API/repository boundaries. Add a card-state adapter over stable persisted lane keys, then replace visible IA and routes with card-first pages. Keep legacy routes as redirects where that preserves compatibility.

**Tech Stack:** Next.js App Router 15, React 19, TypeScript, Tailwind CSS, Prisma/Postgres, Vitest/RTL, Playwright.

---

### Task 1: Card State Adapter

**Files:**
- Create: `src/components/cards/card-state.ts`
- Test: `src/components/cards/card-state.test.ts`

- [ ] Add a failing test that `cards_of_concern` maps to `unassigned`, `player_1` maps to `alex`, `player_2` maps to `max`, `not_in_play` maps to `savedForLater`, and `trimmed` maps to `notApplicable`.
- [ ] Add a failing test that the deck only contains `unassigned` cards.
- [ ] Implement the adapter with stable product labels, actions, and lane mapping.
- [ ] Run `npm test -- src/components/cards/card-state.test.ts --run`.

### Task 2: Card Workspace UI

**Files:**
- Create: `src/components/cards/card-workspace.tsx`
- Test: `src/components/cards/card-workspace.test.tsx`

- [ ] Add failing tests for the Distribute empty state, fallback buttons, arrow-key distribution, Your Cards filtering, and Board bucket headings.
- [ ] Implement a focused mobile-first client component with `view="distribute" | "yourCards" | "board"`.
- [ ] Add pointer gesture handling with axis thresholding and reduced-motion-safe transitions.
- [ ] Run `npm test -- src/components/cards/card-workspace.test.tsx --run`.

### Task 3: App Routes And Actions

**Files:**
- Create: `src/server/responsibilities/card-distribution.ts`
- Create: `src/app/app/your-cards/page.tsx`
- Create: `src/app/app/distribute/page.tsx`
- Create: `src/app/app/board/page.tsx`
- Create: `src/app/app/ask-greg/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/app/app/load-map/page.tsx`
- Modify: `src/components/auth/login-page-client.tsx`
- Modify: `src/components/auth/choose-persona-client.tsx`
- Modify: `src/components/onboarding/onboarding-page-client.tsx`

- [ ] Route root, login next, choose-persona fallback, and onboarding skip to `/app/distribute`.
- [ ] Replace Home and Load Map pages with redirects.
- [ ] Load responsibility overview on each card route.
- [ ] Add server action wrappers that distribute cards, revalidate card routes, and preserve stable lane keys.
- [ ] Run targeted route/component tests.

### Task 4: App Shell Navigation

**Files:**
- Modify: `src/components/app-shell/app-shell.tsx`
- Modify: `src/components/app-shell/page-shell.tsx`
- Test: `src/components/app-shell/app-shell.test.tsx`

- [ ] Replace six primary nav items with Your Cards, Distribute, Board, and Ask Greg.
- [ ] Move Check in, Theory, Settings, and Card Library behind a safe overflow menu.
- [ ] Remove homepage background routing.
- [ ] Keep mobile bottom tabs safe-area-aware and desktop shell compact.
- [ ] Run `npm test -- src/components/app-shell/app-shell.test.tsx --run`.

### Task 5: PWA And Mobile Polish

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/icon.tsx`
- Modify: `src/app/apple-icon.tsx`
- Modify: `src/app/globals.css`
- Add if needed: `public/sw.js`

- [ ] Add `viewport-fit=cover` through Next viewport metadata.
- [ ] Update manifest `start_url`, icon purposes, and mobile theme colors.
- [ ] Ensure safe-area CSS variables drive bottom nav and content padding.
- [ ] Keep service worker minimal and avoid caching household data.
- [ ] Verify no horizontal overflow at phone widths.

### Task 6: Documentation And QA

**Files:**
- Modify: `docs/context/STATUS.md`
- Modify: `docs/context/PROJECT.md`
- Modify: `docs/context/DECISIONS.md`
- Modify: `docs/wiki/index.md`
- Modify: `docs/wiki/architecture.md`
- Modify: `docs/wiki/file-map.md`
- Modify: `e2e/corrective-responsive-visual.spec.ts`
- Modify: `e2e/dark-mode-visual.spec.ts`

- [ ] Update durable memory to describe card-first IA.
- [ ] Refresh responsive smoke pages and headings.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test -- --run`, `npm run prisma:validate`, `npm run build`, and targeted Playwright mobile checks.
