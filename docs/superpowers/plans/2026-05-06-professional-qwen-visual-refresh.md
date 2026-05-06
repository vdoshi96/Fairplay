# Professional Qwen Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and incorporate professional Qwen backgrounds across Fairplay without breaking existing app behavior.

**Architecture:** A foundation branch adds new generated UI asset specs and PNG files. Two downstream UI branches consume the asset contract in separate page groups, then `main` receives the branches in dependency order.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Playwright, Qwen image generation through `scripts/generate-ui-assets.mjs`.

---

### Task 1: Qwen Background Asset Contract

**Files:**
- Modify: `src/server/ai/generated-ui-assets.test.ts`
- Modify: `src/server/ai/generated-ui-assets.ts`
- Create: `public/assets/fairplay/generated-ui/backgrounds/auth-warm-threshold.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/onboarding-rhythm-path.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/library-shelf.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/radar-signal-room.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/check-in-table.png`
- Create: `public/assets/fairplay/generated-ui/backgrounds/settings-preferences.png`
- Modify: `public/assets/fairplay/generated-ui/generation-manifest.json`

- [x] **Step 1: Write the failing asset coverage test**

```ts
expect(GENERATED_UI_ASSETS.map((asset) => asset.slug)).toEqual(
  expect.arrayContaining([
    "auth-warm-threshold-background",
    "app-shell-household-canvas",
    "home-learning-studio-background",
    "onboarding-rhythm-path-background",
    "load-map-workbench-background",
    "library-shelf-background",
    "radar-signal-room-background",
    "check-in-table-background",
    "settings-preferences-background"
  ])
);
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/server/ai/generated-ui-assets.test.ts --run`
Expected: FAIL because the new slugs are not in `GENERATED_UI_ASSETS`.

- [x] **Step 3: Add the asset specs**

Add a `professionalPageBackgroundSpecs` array with the nine slugs above, output paths under `public/assets/fairplay/generated-ui/backgrounds/`, and approved `qwen-image-2.0-pro` generation metadata through the existing exported asset list.

- [x] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/server/ai/generated-ui-assets.test.ts --run`
Expected: PASS.

- [x] **Step 5: Generate Qwen PNGs**

Run:

```bash
npm run assets:generate-ui -- --slugs=auth-warm-threshold-background,app-shell-household-canvas,home-learning-studio-background,onboarding-rhythm-path-background,load-map-workbench-background,library-shelf-background,radar-signal-room-background,check-in-table-background,settings-preferences-background --delay-ms=15000
```

Expected: nine PNG files and a refreshed `generation-manifest.json`.

- [x] **Step 6: Verify generated files**

Run: `npm run test -- src/server/ai/generated-ui-assets.test.ts src/server/ai/generated-ui-asset-files.test.ts --run`
Expected: PASS with every declared PNG present and matching expected dimensions.

### Task 2: Auth, Home, And Onboarding UI Branch

**Files:**
- Modify: `src/components/auth/auth-page-shell.tsx`
- Modify: `src/components/auth/create-household-page-client.tsx`
- Modify: `src/components/auth/choose-persona-client.tsx`
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/components/onboarding/onboarding-guide.tsx`
- Modify: focused component tests for those surfaces

- [ ] **Step 1: Write failing tests**

Add assertions that auth pages render the generated auth background, the home page renders the learning studio background, and onboarding renders the rhythm path background.

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm run test -- src/components/app-shell/app-shell.test.tsx src/components/auth/auth-forms.test.tsx src/components/onboarding/onboarding-flow.test.tsx --run`
Expected: FAIL on missing generated visual hooks.

- [ ] **Step 3: Wire generated visuals**

Use the committed background assets as decorative images or covered panels with solid text surfaces. Preserve existing links, form behavior, guide anchors, and skip routing.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm run test -- src/components/app-shell/app-shell.test.tsx src/components/auth/auth-forms.test.tsx src/components/onboarding/onboarding-flow.test.tsx --run`
Expected: PASS.

### Task 3: Feature Pages UI Branch

**Files:**
- Modify: `src/components/responsibilities/responsibility-load-map.tsx`
- Modify: `src/components/library/card-library.tsx`
- Modify: `src/app/app/library/page.tsx`
- Modify: `src/components/radar/radar-board.tsx`
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: focused component tests for those surfaces

- [ ] **Step 1: Write failing tests**

Add assertions that Load Map, Library, Radar, Check-ins, and Settings render their page-specific generated backgrounds without changing existing workflow controls.

- [ ] **Step 2: Run focused tests and verify they fail**

Run: `npm run test -- src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx --run`
Expected: FAIL on missing generated visual hooks.

- [ ] **Step 3: Wire generated visuals**

Add professional page headers and contextual visual panels that keep operational controls scannable and maintain current guide targets.

- [ ] **Step 4: Run focused tests and verify they pass**

Run: `npm run test -- src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx --run`
Expected: PASS.

### Task 4: Merge QA And GitHub Sync

**Files:**
- Modify: `docs/superpowers/outcomes/2026-05-06-professional-qwen-visual-refresh.md`

- [ ] **Step 1: Merge branches in order**

Merge `codex/visual-asset-system`, then `codex/visual-auth-home`, then `codex/visual-feature-pages` into `main`.

- [ ] **Step 2: Run full local verification**

Run:

```bash
npm run lint
npm run typecheck
npm run test -- --run
npm run build
npm run test:e2e
```

Expected: all commands exit 0.

- [ ] **Step 3: Record outcome**

Document branch order, subagent responsibilities, blockers, achievements, and verification evidence in `docs/superpowers/outcomes/2026-05-06-professional-qwen-visual-refresh.md`.

- [ ] **Step 4: Push `main`**

Run: `git push origin main`
Expected: `origin/main` points at the same commit as local `main`.
