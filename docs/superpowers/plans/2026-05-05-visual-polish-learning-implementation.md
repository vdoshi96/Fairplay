# Visual Polish Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the learning visuals by removing `App Guide 101`, making crash-course art immersive, replacing the thin login illustration with a richer scene, and varying helper characters across guide entry points.

**Architecture:** Keep visuals local and code-owned using React, SVG, and Tailwind. Split by component ownership so subagents can work in parallel without touching the same files. The controller integrates tests, browser checks, PR, and merge.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Vitest/Testing Library, Playwright.

---

## File Ownership Map

- Crash course immersive stage:
  - Modify `src/components/crash-course/crash-course-flow.tsx`
  - Modify `src/components/crash-course/crash-course-flow.test.tsx`
  - Modify `src/components/crash-course/crash-course-scene.tsx`
  - Modify `src/components/crash-course/crash-course-scene.test.tsx`
  - Create `docs/implementation/2026-05-05-task-21-crash-course-immersive.md`
- Login splash upgrade:
  - Modify `src/components/auth/login-splash-illustration.tsx`
  - Modify `src/components/auth/login-splash-illustration.test.tsx`
  - Modify `src/components/auth/auth-forms.test.tsx`
  - Modify `src/app/globals.css`
  - Create `docs/implementation/2026-05-05-task-22-login-splash-polish.md`
- Learning copy and guide helper variation:
  - Modify `src/app/app/home/page.tsx`
  - Modify `src/components/welcome/persistent-welcome.tsx`
  - Modify `src/components/welcome/persistent-welcome.test.tsx`
  - Modify `src/components/settings/settings-panel.tsx`
  - Modify `src/components/settings/settings-panel.test.tsx`
  - Modify `src/components/app-shell/app-shell.test.tsx`
  - Modify `src/components/guide/feature-guide-launcher.tsx`
  - Modify `src/components/guide/feature-guide-launcher.test.tsx`
  - Create `src/components/guide/feature-guide-helper.tsx`
  - Create `src/components/guide/feature-guide-helper.test.tsx`
  - Modify `e2e/guided-learning.spec.ts`
  - Create `docs/implementation/2026-05-05-task-23-learning-copy-guide-helpers.md`
- Controller verification:
  - Create `docs/implementation/2026-05-05-task-24-visual-polish-verification.md`

## Task 21: Crash Course Immersive Stage

**Files:** crash-course flow, scene, tests, report.

- [ ] Write failing tests asserting the crash course renders an immersive stage, the scene has a large background role image, and the owner/helper scene includes distinct large characters/props.
- [ ] Run `npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx` and verify the tests fail for missing immersive classes/scene details.
- [ ] Update `CrashCourseFlow` so the course is a full-viewport lesson stage with the scene behind the text panel.
- [ ] Replace repeated mini scene artwork in `CrashCourseScene` with lesson-specific compositions and larger character groups.
- [ ] Run the focused crash-course tests and lint for owned files.
- [ ] Write `docs/implementation/2026-05-05-task-21-crash-course-immersive.md`.

## Task 22: Login Splash Polish

**Files:** login splash, auth tests, global motion CSS, report.

- [ ] Write failing tests asserting the login scene includes a richer garden/home background, large character group, floating cards, and existing accessible image label.
- [ ] Run `npx vitest run src/components/auth/login-splash-illustration.test.tsx src/components/auth/auth-forms.test.tsx` and verify the tests fail for missing richer scene elements.
- [ ] Rebuild `LoginSplashIllustration` as a denser illustrated scene with large characters, garden path, house, sky/nature layers, and floating cards.
- [ ] Add only minimal CSS keyframes needed for subtle local motion and reduced-motion coverage.
- [ ] Run the focused auth tests and lint for owned files.
- [ ] Write `docs/implementation/2026-05-05-task-22-login-splash-polish.md`.

## Task 23: Learning Copy and Guide Helper Variation

**Files:** Home, welcome, settings, guide launcher/helper, tests, e2e, report.

- [ ] Write failing tests asserting `App Guide 101` is absent, Home uses `Learn a feature`, welcome links to `Learn a feature`, settings uses plain replay language, and guide helpers vary by feature.
- [ ] Run focused tests:
  - `npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx src/components/guide/feature-guide-launcher.test.tsx`
  - Expected failure before implementation.
- [ ] Create `FeatureGuideHelper` that renders feature-specific helper scenelets for load map, library, radar, check-ins, and settings.
- [ ] Use `FeatureGuideHelper` in the launcher and Home feature cards instead of the same helper mascot.
- [ ] Rename Home section/link IDs from `app-guide-101` to `learn-a-feature`.
- [ ] Remove `Open App Guide 101` copy from welcome, settings, and e2e.
- [ ] Run focused tests and lint for owned files.
- [ ] Write `docs/implementation/2026-05-05-task-23-learning-copy-guide-helpers.md`.

## Task 24: Controller Integration and PR

**Files:** verification report only unless tests reveal an integration issue.

- [ ] Review each worker diff for spec compliance and code quality.
- [ ] Commit each task slice separately.
- [ ] Run:
  - `npm run lint`
  - `npm run typecheck`
  - `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npx vitest run`
  - `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run build`
  - `DATABASE_URL='postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public' npm run test:e2e`
- [ ] Write `docs/implementation/2026-05-05-task-24-visual-polish-verification.md`.
- [ ] Push, open PR, wait for Vercel, merge, and align local `main` with GitHub `main`.

## Self-Review

- Spec coverage: all user requests map to tasks 21-24.
- Placeholder scan: no `TBD` or unspecified implementation-only tasks remain.
- Type consistency: guide IDs stay `loadMap`, `library`, `radar`, `checkIns`, `settings`; the public guide query API does not change.
