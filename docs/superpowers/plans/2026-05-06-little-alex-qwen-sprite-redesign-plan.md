# Little Alex Qwen Sprite Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Keep branch ownership tight, do not revert other agents' edits, and record test evidence in the task docs.

**Goal:** Replace Little Alex's CSS-only visual model with Qwen-generated transparent sprite parts, fix detached shoulders, and prove the behavior survives with focused and final QA.

**Architecture:** `LittleAlexPhysics` remains the behavioral owner. A new sprite asset spec and generation script own Qwen prompts and generated files. The component maps presentation + body part to committed PNG sprite paths and renders those sprites inside the existing Matter.js body transforms.

**Branches:**
- `codex/little-alex-qwen-assets`: sprite specs, Qwen generator, generated PNG assets, asset docs.
- `codex/little-alex-sprite-renderer`: component/CSS/tests for rendering sprites and shoulder attachment.
- `codex/little-alex-sprite-qa`: Playwright/visual QA updates and final evidence docs.

## Task 1: Asset Spec and Qwen Generation

**Files:**
- Create: `src/server/ai/little-alex-sprite-assets.ts`
- Create: `scripts/generate-little-alex-sprites.mjs`
- Modify: `package.json`
- Create/modify: `public/assets/fairplay/little-alex-sprites/*`
- Create: `docs/agents/tasks/2026-05-06-little-alex-qwen-sprite-redesign/qwen-assets.md`

- [ ] Add typed sprite specs for 18 assets: 3 presentations x 6 body parts.
- [ ] Prompt all variants with black suit, white shirt, clipboard continuity.
- [ ] Prompt the feminine head with long hair.
- [ ] Generate sprites through Qwen, remove chroma key, and write transparent PNGs.
- [ ] Commit generation manifest with model, prompts, output paths, and QA notes.
- [ ] Run `npm run assets:generate-little-alex -- --dry-run`.

## Task 2: Sprite Renderer and Shoulder Fix

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Create: `docs/agents/tasks/2026-05-06-little-alex-qwen-sprite-redesign/sprite-renderer.md`

- [ ] Render one sprite image per body part using presentation-specific asset paths.
- [ ] Keep hidden/semantic suit and clipboard test markers while the visual asset carries the real look.
- [ ] Move arm body offsets inward so shoulder bounds overlap the torso.
- [ ] Update idle pose and created body positions to use the same part config offsets.
- [ ] Add/adjust unit tests for sprite path switching, feminine long-hair marker, body contract, skin-tone metadata, and shoulder overlap.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`.

## Task 3: E2E, Visual QA, and Docs

**Files:**
- Modify: `e2e/little-alex-physics.spec.ts`
- Create/modify: `docs/agents/tasks/2026-05-06-little-alex-qwen-sprite-redesign/*.md`

- [ ] Update e2e assertions from CSS detail markers to sprite asset markers.
- [ ] Add visual screenshot capture for neutral, masculine, and feminine variants.
- [ ] Confirm the fling bubble, gaze, safe-area, mobile, and reduced-motion behaviors still pass.
- [ ] Record branch QA evidence and any blockers.
- [ ] Run `npm run test:e2e -- little-alex-physics.spec.ts`.

## Task 4: Integration and Final QA

- [ ] Merge branches in order: plan, assets, renderer, QA.
- [ ] Resolve conflicts without dropping generated assets, tests, or docs.
- [ ] Run `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run test:e2e`, and `npm run build`.
- [ ] Capture/inspect visual screenshots for the Little Alex variants.
- [ ] Push `main`.
- [ ] Verify `git rev-parse HEAD` equals `git ls-remote origin refs/heads/main`.
