# Fairplay UI Layout Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Fairplay's protected-app layout and visual composition into a cohesive shell-backed system without changing product behavior.

**Architecture:** `AppShell` keeps navigation/session chrome while new page primitives standardize route composition. Existing Qwen assets are consumed as absolute decorative background layers behind readable content surfaces. Each required branch owns one bounded UI concern and merges into `main` in dependency order.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Vitest/Testing Library, existing Qwen-generated PNG assets.

---

### Task 1: Layout Shell Foundation

**Branch:** `codex/layout-shell-refactor`

**Files:**
- Create: `src/components/app-shell/page-shell.tsx`
- Modify: `src/components/app-shell/app-shell.tsx`
- Modify: `src/components/app-shell/app-shell.test.tsx`
- Modify: route/page wrappers as needed: `src/app/app/home/page.tsx`, `src/app/app/library/page.tsx`, `src/components/radar/radar-board.tsx`, `src/components/settings/settings-panel.tsx`

- [ ] **Step 1: Add failing shell tests**

Assert standard routes render a stable page-shell foreground and that `AppShell` no longer paints the app art directly on `data-testid="app-main"`.

Run: `npm run test -- src/components/app-shell/app-shell.test.tsx --run`
Expected: FAIL until the new shell exists.

- [ ] **Step 2: Implement page primitives**

Create `PageShell`, `PageHeader`, and `PageSection`/surface helpers with standard max width, padding, z-index, optional `background`, and compact header slots.

- [ ] **Step 3: Wire standard route wrappers**

Use `PageShell` around home/library/radar/settings/check-in launcher surfaces where the component already owns route layout. Keep crash course immersive behavior unchanged.

- [ ] **Step 4: Verify**

Run:

```bash
npm run test -- src/components/app-shell/app-shell.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/settings/settings-panel.test.tsx --run
npm run lint
npm run typecheck
npm run build
```

Expected: all commands exit 0.

### Task 2: Background Art Integration

**Branch:** `codex/background-art-integration`

**Files:**
- Modify: `src/components/app-shell/page-shell.tsx`
- Modify: `src/components/visuals/fairplay-visuals.tsx`
- Modify: `src/app/globals.css`
- Modify: page components consuming feature backgrounds
- Modify: focused visual/component tests

- [ ] **Step 1: Add failing background-layer tests**

Assert page backgrounds render as decorative layers with `aria-hidden`, controlled opacity/mask class names, and existing asset URLs.

- [ ] **Step 2: Convert art to background layers**

Render existing background assets through `PageShell`/background-layer props or small visual helpers. Remove large foreground image/card compositions where they duplicate the background.

- [ ] **Step 3: Add responsive treatment**

Use absolute positioning, opacity, masks, and breakpoint-specific sizing so artwork stays behind content and never overlaps form controls as foreground content.

- [ ] **Step 4: Verify**

Run focused tests for visual consumers, then `npm run lint`, `npm run typecheck`, and `npm run build`.

### Task 3: Welcome Banner Cleanup

**Branch:** `codex/welcome-banner-cleanup`

**Files:**
- Modify: `src/components/welcome/persistent-welcome.tsx`
- Modify: `src/components/welcome/persistent-welcome.test.tsx`
- Modify: `src/app/app/layout.tsx` only if needed to pass route context

- [ ] **Step 1: Add failing tests**

Assert home renders the fuller welcome surface, feature routes render a compact surface, and dismissal still PATCHes `/api/preferences/onboarding`.

- [ ] **Step 2: Implement contextual compact banner**

Use `usePathname()` inside the client component or an explicit prop to reduce the banner on non-home routes. Preserve the dismissed prop, local close state, error handling, and links.

- [ ] **Step 3: Verify**

Run `npm run test -- src/components/welcome/persistent-welcome.test.tsx src/components/app-shell/app-shell.test.tsx --run`, then lint, typecheck, and build.

### Task 4: Check-In Page Redesign

**Branch:** `codex/check-in-page-redesign`

**Files:**
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/check-ins/check-in-flow.test.tsx`

- [ ] **Step 1: Add failing layout tests**

Assert the New Check-in launcher renders a centered workflow region, grouped primary/secondary actions, and a small decorative check-in visual.

- [ ] **Step 2: Rebuild launcher composition**

Keep `previewAgenda`, `startCheckIn`, `setSuggestions`, and started-check-in rendering intact. Replace the malformed foreground art card with a centered workflow card, helper text, grouped CTAs, and restrained decorative art.

- [ ] **Step 3: Verify**

Run `npm run test -- src/components/check-ins/check-in-flow.test.tsx --run`, then lint, typecheck, and build.

### Task 5: Page Polish Pass And Final Sync

**Branch:** `codex/page-polish-pass`

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/app/app/library/page.tsx`
- Modify: `src/components/library/card-library.tsx`
- Modify: `src/components/radar/radar-board.tsx`
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: focused tests affected by polish

- [ ] **Step 1: Final route consistency check**

Inspect Library, Radar, Check-ins, Crash course, and Settings for spacing, width, button grouping, and responsive collisions.

- [ ] **Step 2: Apply polish only**

Tighten layout classes, card elevation, borders, and spacing. Do not alter business logic, data calls, or Little Alex.

- [ ] **Step 3: Final verification and merge**

Run:

```bash
npm run test -- --run
npm run lint
npm run typecheck
npm run build
```

Merge all branches to `main` in order, push `main`, and verify `git rev-parse main` equals `git rev-parse origin/main`.
