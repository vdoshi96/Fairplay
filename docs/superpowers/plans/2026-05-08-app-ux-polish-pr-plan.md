# App UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce copy overload, strengthen generated backgrounds, simplify page workflows, and merge focused UX fixes through ordered PRs.

**Architecture:** Keep existing Next.js App Router, Tailwind tokens, server services, and 8px radius conventions. Make foundational visual/copy changes first, then branch page-specific work from the latest merged `main` to minimize conflicts.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest, Playwright, Prisma.

---

## Branch Order

1. `codex/ux-foundation-background-copy`
   - Global background visibility and surface contrast.
   - Shorter Home and Settings copy.
   - Shared docs for this UX pass.
2. `codex/load-map-dashboard-polish`
   - Redesigned Load Map dashboard/filter area.
   - Preserve lane board behavior and drag/drop surface.
3. `codex/library-card-workflow-polish`
   - Library card wrapping/overflow QA.
   - Compact card-detail move control.
   - Clearer Library dummy workflow field labels.
4. `codex/check-ins-lightweight-records`
   - Check-ins reduced to scheduling, confirming completion, and optional minutes/notes.
   - Remove agenda/decision workflow from the visible UI.
5. `codex/crash-course-concept-polish`
   - Rewrite Crash Course lessons around source-safe concepts.
   - Keep app-use recommendations only in the final learning path.
   - Final docs, responsive QA, PR merge confirmation.

## Shared Constraints

- Do not open or summarize private files under `References/`.
- Use existing generated background assets; do not regenerate unless a later explicit source review approves it.
- Keep copy practical, non-clinical, non-blaming, and source-safe.
- Do not rename persisted board lane enum keys.
- Keep page surfaces mobile-first, readable, and operationally dense.

## Tasks

### Task 1: Foundation

**Files:**
- Modify: `src/components/app-shell/page-shell.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/app/home/page.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify tests for the same surfaces.
- Create/update UX notes under `docs/implementation/`.

- [ ] Write failing tests for stronger background classes and shorter Home/Settings copy.
- [ ] Implement shared generated-background opacity/wash improvements.
- [ ] Shorten Home and Settings copy without changing workflow links.
- [ ] Run focused Vitest for app shell and settings.
- [ ] Run lint/typecheck for touched files or full repo if practical.
- [ ] Commit, push, open PR, merge, pull `main`.

### Task 2: Load Map

**Files:**
- Modify: `src/components/responsibilities/responsibility-load-map.tsx`
- Modify: `src/components/responsibilities/responsibility-load-map.test.tsx`
- Update docs.

- [ ] Write failing tests for simplified dashboard labels and polished filter layout.
- [ ] Redesign the top dashboard and filter section.
- [ ] Preserve board lanes, drag/drop, scroll controls, and move menu behavior.
- [ ] Run focused Load Map unit tests and e2e lane-board smoke if practical.
- [ ] Commit, push, open PR, merge, pull `main`.

### Task 3: Library And Card Practice

**Files:**
- Modify: `src/components/library/card-library.tsx`
- Modify: `src/components/library/ai-task-manager.tsx`
- Modify: `src/components/cards/card-detail-sheet.tsx`
- Modify matching tests.
- Update docs.

- [ ] Write failing tests for compact move dropdown, wrapping/truncation classes, and clearer draft field help.
- [ ] Replace card-detail move tiles with a compact select/action control.
- [ ] Tighten Library page and dummy workflow copy.
- [ ] Add overflow-resistant card classes on desktop and mobile.
- [ ] Run focused Library/card tests.
- [ ] Commit, push, open PR, merge, pull `main`.

### Task 4: Check-Ins

**Files:**
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/server/check-ins/service.ts`
- Modify: `src/app/api/check-ins/route.ts`
- Modify matching tests.
- Update docs.

- [ ] Write failing tests for schedule-only creation, confirmation, and notes/minutes update.
- [ ] Support `scheduledFor` in the create route/service while preserving existing route safety.
- [ ] Replace agenda/decision UI with schedule, confirm, and notes controls.
- [ ] Keep old APIs unless removal is proven safe; hide unrelated concepts from UI.
- [ ] Run focused Check-ins tests and targeted e2e flow if practical.
- [ ] Commit, push, open PR, merge, pull `main`.

### Task 5: Crash Course And Final QA

**Files:**
- Modify: `src/components/crash-course/crash-course-content.ts`
- Modify: `src/components/crash-course/crash-course-flow.tsx`
- Modify matching tests.
- Update `docs/context/STATUS.md`, `docs/context/LOG.md`, and implementation notes.

- [ ] Use cleared repo research docs, not private `References/`.
- [ ] Write failing tests for concise concept-first lessons and final-only app learning path.
- [ ] Rewrite lessons to reduce filler and app instructions.
- [ ] Integrate the title/header into the course layout without a floating tile feel.
- [ ] Run focused crash-course tests, full lint/typecheck/test/build, and responsive browser QA.
- [ ] Commit, push, open PR, merge, pull `main`.
- [ ] Confirm local `main` and `origin/main` point to the same final commit.
