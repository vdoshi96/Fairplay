# Fairplay Polish Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver dark-mode readability, Greg Taskmaster Library polish, and richer Little Alex customization/behavior.

**Architecture:** Three isolated feature branches merge into main in dependency order. Theme fixes are systemic and verified visually; Greg is UI/asset-only; Little Alex adds persona-scoped preferences plus physics behavior.

**Tech Stack:** Next.js App Router, React 19, Tailwind utility classes, Matter.js, Prisma/Postgres, Vitest, Playwright.

---

## Task 1: Theme Toggle And Dark QA

**Files:**
- Modify `src/components/settings/settings-panel.tsx`
- Modify `src/components/settings/settings-panel.test.tsx`
- Modify `src/app/globals.css`
- Add or modify `e2e/dark-mode-visual.spec.ts`
- Add `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/theme-dark-qa.md`

- [ ] Write tests for a system toggle plus explicit light/dark switch in Settings.
- [ ] Write focused dark-mode class/contrast regressions for risky controls.
- [ ] Implement the Settings UI using existing `useTheme()`.
- [ ] Add dark-mode utility overrides and targeted token fixes for hard-coded white/stone surfaces.
- [ ] Run focused tests and Playwright dark visual smoke.
- [ ] Save screenshots under `test-results/dark-mode-polish/` or document Playwright artifact paths.
- [ ] Commit with message `fix: improve dark mode readability`.

## Task 2: Greg Taskmaster Avatar

**Files:**
- Add `public/assets/fairplay/generated-ui/greg-taskmaster-avatar.png`
- Modify `src/components/library/ai-task-manager.tsx`
- Modify `src/components/library/ai-task-manager.test.tsx`
- Modify `src/components/library/card-library.test.tsx`
- Modify `src/components/guide/guide-content.ts`
- Modify `src/components/guide/guide-content.test.ts`
- Modify `e2e/guided-learning.spec.ts`
- Add `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/greg-taskmaster-avatar.md`

- [ ] Prepare the generated avatar with transparent background and validate it renders cleanly.
- [ ] Write tests expecting `Greg - The Taskmaster`, the static Greg avatar, and absence of the local Little Alex sidekick.
- [ ] Replace `LittleAlexHorneSidekick` with a Greg avatar stage above the button.
- [ ] Update guide copy capitalization.
- [ ] Run focused Library/guide tests and guided-learning E2E.
- [ ] Commit with message `feat: add greg taskmaster avatar`.

## Task 3: Little Alex Preferences And Behavior

**Files:**
- Modify `prisma/schema.prisma`
- Add `prisma/migrations/*_add_little_alex_preferences/migration.sql`
- Modify `src/contracts/preferences.ts`
- Modify `src/contracts/preferences.test.ts`
- Modify `src/server/repositories/preferences.ts`
- Modify `src/server/repositories/preferences.test.ts`
- Add `src/app/api/preferences/little-alex/route.ts`
- Add `src/app/api/preferences/little-alex/route.test.ts`
- Modify `src/app/app/layout.tsx`
- Modify `src/app/app/settings/page.tsx`
- Modify `src/components/app-shell/app-shell.tsx`
- Modify `src/components/app-shell/app-shell.test.tsx`
- Modify `src/components/settings/settings-panel.tsx`
- Modify `src/components/settings/settings-panel.test.tsx`
- Modify `src/components/little-alex/little-alex-physics.tsx`
- Modify `src/components/little-alex/little-alex-physics.test.tsx`
- Modify `src/app/globals.css`
- Modify `e2e/little-alex-physics.spec.ts`
- Add `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/little-alex-upgrades.md`

- [ ] Write contract tests for constrained gender, 30-character phrase, and skin tone values.
- [ ] Add Prisma model and migration.
- [ ] Write repository and API route tests for get/update defaults and validation.
- [ ] Implement repository and route.
- [ ] Pass preferences from app layout into `AppShell` and `LittleAlexPhysics`.
- [ ] Add Settings controls with optimistic save/status/error behavior.
- [ ] Write Little Alex tests for 10% fling multiplier, bubble after fling, idle mode after 5 seconds, and reduced-motion opt out.
- [ ] Implement physics behavior and styling: black suit, white shirt, clipboard, skin-tone variables, idle walk, glance, bubble.
- [ ] Run focused tests and Little Alex E2E.
- [ ] Commit with message `feat: upgrade little alex behavior`.

## Task 4: Mainline Integration And Final QA

**Files:**
- Modify `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/final-qa.md`
- Modify `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/achievements.md`
- Modify `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/blockers.md`
- Modify `docs/agents/tasks/2026-05-06-fairplay-polish-upgrades/work-log.md`

- [ ] Merge branches to main in the documented order.
- [ ] Run focused checks after each merge.
- [ ] Run final lint, typecheck, full Vitest, and full Playwright.
- [ ] Review dark-mode screenshots with vision and record issues/fixes.
- [ ] Commit final QA docs.
- [ ] Push `main`.
- [ ] Verify `git rev-parse HEAD` equals `git ls-remote origin refs/heads/main`.
