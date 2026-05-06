# Generated UI Assets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace non-card UI visuals with cute flat 2D generated assets while preserving source-card cover assets.

**Architecture:** Add a Qwen-only UI asset generator and a central generated UI asset map. Wire reusable visual components, login splash, crash course scenes, guide helpers, and the AI task manager sidekick to generated PNGs under `public/assets/fairplay/generated-ui/`.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, Qwen `qwen-image-2.0-pro` via Vercel env.

---

### Task 1: Document Scope And Inventory

**Files:**
- Create: `docs/agents/tasks/2026-05-05-generated-ui-assets/task.md`
- Create: `docs/agents/tasks/2026-05-05-generated-ui-assets/work-log.md`
- Create: `docs/agents/tasks/2026-05-05-generated-ui-assets/gaps.md`
- Create: `docs/agents/tasks/2026-05-05-generated-ui-assets/learned.md`
- Create: `docs/superpowers/outcomes/2026-05-05-generated-ui-assets.md`

- [x] **Step 1: Record task boundary**

Write that `public/assets/fairplay/cards/` is excluded and all generated UI assets must live under `public/assets/fairplay/generated-ui/`.

- [x] **Step 2: Record subagent findings**

Summarize visual inventory, generation prompts, QA risks, and blockers in the work log and outcomes doc.

### Task 2: Add UI Asset Generation Pipeline

**Files:**
- Create: `src/server/ai/generated-ui-assets.ts`
- Create: `src/server/ai/generated-ui-assets.test.ts`
- Create: `scripts/generate-ui-assets.mjs`

- [x] **Step 1: Write failing tests**

Add tests proving UI asset specs are non-card, use generated UI output paths, require PNG filenames, and expose approved Qwen-only generation metadata.

- [x] **Step 2: Run focused tests**

Run: `npm run test -- src/server/ai/generated-ui-assets.test.ts`

Expected before implementation: fail because the modules do not exist.

- [x] **Step 3: Implement specs and prompts**

Define assets for login, avatars, helper mascot, app mark, radar, check-in, guide helper thumbnails, AI sidekick, crash-course completion, and each crash-course lesson background.

- [x] **Step 4: Implement generator**

Create a Qwen-only script that validates `QWEN_IMAGE_MODEL === "qwen-image-2.0-pro"`, writes PNGs and a manifest, and supports `--dry-run`, `--slugs`, `--limit`, and `--output-dir`.

- [x] **Step 5: Verify focused tests pass**

Run: `npm run test -- src/server/ai/generated-ui-assets.test.ts`

### Task 3: Generate And Commit UI Assets

**Files:**
- Create: `public/assets/fairplay/generated-ui/*.png`
- Create: `public/assets/fairplay/generated-ui/generation-manifest.json`

- [x] **Step 1: Dry-run prompts**

Run: `npm run assets:generate-ui -- --dry-run --output-dir=/tmp/fairplay-generated-ui-dry-run`

- [x] **Step 2: Generate through Vercel production env**

Run from the root checkout Vercel context while targeting the worktree when needed:

`npx --yes vercel env run -e production -- bash -lc 'cd /Users/vishal/Developer/Fairplay/.worktrees/generated-ui-assets && npm run assets:generate-ui -- --output-dir=public/assets/fairplay/generated-ui'`

- [x] **Step 3: Inspect dimensions**

Run: `sips -g pixelWidth -g pixelHeight public/assets/fairplay/generated-ui/*.png`

- [x] **Step 4: Reject or regenerate broken assets**

Reject assets with readable text, logos, non-2D style, poor framing, or obvious mismatch to the intended UI.

### Task 4: Wire Generated Assets Into UI

**Files:**
- Modify: `src/components/visuals/fairplay-visuals.tsx`
- Modify: `src/components/visuals/fairplay-visuals.test.tsx`
- Modify: `src/components/auth/login-splash-illustration.tsx`
- Modify: `src/components/auth/login-splash-illustration.test.tsx`
- Modify: `src/components/crash-course/crash-course-scene.tsx`
- Modify: `src/components/crash-course/crash-course-scene.test.tsx`
- Modify: `src/components/guide/feature-guide-helper.tsx`
- Modify: `src/components/guide/feature-guide-helper.test.tsx`
- Modify: `src/components/library/ai-task-manager.tsx`
- Modify: `src/components/library/ai-task-manager.test.tsx`

- [x] **Step 1: Write failing tests**

Update tests to expect `/assets/fairplay/generated-ui/` paths and not old SVG/CSS-only visuals.

- [x] **Step 2: Run focused tests**

Run: `npm run test -- src/components/visuals/fairplay-visuals.test.tsx src/components/auth/login-splash-illustration.test.tsx src/components/crash-course/crash-course-scene.test.tsx src/components/guide/feature-guide-helper.test.tsx src/components/library/ai-task-manager.test.tsx`

Expected before implementation: fail on old paths/rendering.

- [x] **Step 3: Implement UI wiring**

Use generated PNGs for non-card visuals while keeping `public/assets/fairplay/cards/` references untouched.

- [x] **Step 4: Verify focused tests pass**

Run the same focused test command and confirm all pass.

### Task 5: Final QA And Documentation

**Files:**
- Modify: `docs/superpowers/outcomes/2026-05-05-generated-ui-assets.md`
- Modify: `docs/agents/tasks/2026-05-05-generated-ui-assets/work-log.md`
- Modify: `docs/agents/tasks/2026-05-05-generated-ui-assets/gaps.md`
- Modify: `docs/agents/tasks/2026-05-05-generated-ui-assets/learned.md`

- [x] **Step 1: Run verification**

Run:

```bash
npm run typecheck
npm run lint
npm run test
npm run build
git diff --check
```

- [x] **Step 2: Browser QA**

Run Playwright browser checks and spot-check representative generated artwork before committing.

- [x] **Step 3: Record outcome**

Record generated asset count, files touched, verification results, and blockers.
