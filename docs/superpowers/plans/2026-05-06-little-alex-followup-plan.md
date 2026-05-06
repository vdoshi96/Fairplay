# Little Alex Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct Little Alex appearance, bounds, idle movement, gaze, and fling bubble behavior.

**Architecture:** Keep the existing `LittleAlexPhysics` component and Matter.js ragdoll, but introduce explicit safe-area, appearance, idle-turn, gaze, and fling-threshold behavior. Preserve existing Settings persistence and all suit/clipboard styling.

**Tech Stack:** Next.js, React, Matter.js, Vitest, Playwright, Tailwind/global CSS.

---

### Task 1: Appearance Variants

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Modify: `e2e/little-alex-physics.spec.ts`
- Create: `docs/agents/tasks/2026-05-06-little-alex-followup/appearance-variants.md`

- [ ] Add tests proving neutral, masculine, and feminine variants expose visibly different variant markers while retaining `little-alex-shirt` and `little-alex-clipboard`.
- [ ] Add presentation-specific details that do not change physics body keys: hair shape, brow/mouth details, jacket lapels, shoulder/waist silhouette, and optional CSS variables/classes.
- [ ] Verify the variant switch does not remove body parts or interactive grab target.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx src/components/settings/settings-panel.test.tsx`.

### Task 2: Bounds and Idle Movement

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Modify: `e2e/little-alex-physics.spec.ts`
- Create: `docs/agents/tasks/2026-05-06-little-alex-followup/bounds-idle.md`

- [ ] Add tests for desktop safe area: all visible body parts stay to the right of the 16rem sidebar at `lg` widths.
- [ ] Add tests for delayed idle after release: drag/fling release should restart the stand-up timer with 1-2 seconds more delay than untouched idle.
- [ ] Add tests for turn-based walking: walking direction is stable for at least three turns and each turn target moves at least 5% of available width.
- [ ] Implement safe bounds through a `playAreaBounds()` helper used by anchor clamps, body containment, drag movement, idle pose, and resize handling.
- [ ] Replace per-frame drift with turn target movement and calmer paused/standing poses.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`.

### Task 3: Gaze and Fling Bubble

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Modify: `e2e/little-alex-physics.spec.ts`
- Create: `docs/agents/tasks/2026-05-06-little-alex-followup/gaze-bubble.md`

- [ ] Add tests proving pointer movement changes gaze state and touch start updates the mobile last-touch gaze.
- [ ] Add tests proving simple click release does not show the bubble, while drag/fling release does.
- [ ] Add CSS/DOM state for head and eye direction that visibly tracks left/right attention.
- [ ] Use drag distance and release velocity thresholds so bubble behavior matches flings rather than clicks.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`.

### Task 4: Integration and Final QA

**Files:**
- Modify: task documentation under `docs/agents/tasks/2026-05-06-little-alex-followup/`

- [ ] Merge branches in order: appearance, bounds/idle, gaze/bubble.
- [ ] Resolve conflicts without dropping tests or docs.
- [ ] Run `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run test:e2e`, and `npm run build`.
- [ ] Push `main` and verify `git rev-parse HEAD` matches `git ls-remote origin refs/heads/main`.
