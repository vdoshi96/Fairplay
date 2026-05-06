# Fairplay Interaction Upgrades Design

## Goal

Upgrade Fairplay's learning, generated imagery, app theme, login ergonomics, and global Little Alex Horne presence without regressing existing protected app flows.

## Current Context

Fairplay is a Next.js App Router application with protected routes under `src/app/app`, shared chrome in `src/components/app-shell/app-shell.tsx`, Tailwind classes backed by CSS custom properties in `src/app/globals.css`, Vitest unit/component tests, and Playwright end-to-end tests under `e2e/`.

The existing state is light-only, uses native form submission for login, has a short skippable `GuidedTour`, displays generated Qwen card images as small card-like previews, and renders Little Alex Horne only inside the Library AI task manager.

## Workstreams

### 1. Theme And Login Ergonomics

Add a `System / Light / Dark` appearance control in Settings. System mode follows `prefers-color-scheme`; explicit Light or Dark overrides the system. The preference can be persisted in `localStorage` because this is a device appearance preference, not household data. Theme application should happen before paint using a tiny client script or an early mounted provider so the root element receives a stable theme attribute.

Login should preserve native form semantics and gain regression coverage that pressing Enter inside logged-out username or password fields submits the login form exactly like pressing the button. No global key handler should be added for login.

### 2. Integrated Qwen Generated Art

Generated Qwen images should stop reading as small cards pasted onto coordinates. Prompts should ask for original textless Fairplay app illustrations with a large central silhouette, generous whitespace, no fake card border, no title text, and app-native colors. The visual reference is Duolingo's homepage treatment: a cartoon/illustration is a primary layout character, not a framed thumbnail.

The AI draft review panel and accepted responsibility detail page should present generated images as large blended art panels. Accepted AI-generated covers already persist as `sourceCoverAssetPath`; the detail contract and detail page should expose that field so generated responsibility art survives after putting a draft in play.

### 3. Learn-By-Doing Feature Guides

The guide may remain skippable and exitable. Advancing past required practice steps must require the user to complete page-level practice actions. The existing one-click coach-box actions are not enough.

Each feature guide should include hands-on practice that exercises the real surface or a clearly safe dummy sandbox on the real surface:

- Load Map: move a dummy card between lanes, open and use a move menu, and remove or trim a dummy card.
- Library: open Greg capture, fill a dummy task, review a dummy draft, edit generated fields, regenerate/preview the image flow when safe, and put a dummy card in play.
- Radar: create a dummy draft topic, publish or keep it private, defer/schedule, resolve, and delete/dismiss a dummy item.
- Check-ins: build or preview an agenda, assign a topic, record a decision, defer an item, and complete a dummy check-in.
- Settings: change appearance mode, replay welcome, switch persona flow up to confirmation, and locate the learning hub without leaving the guide.

Practice data must not mutate real household data unless an action is already a safe existing user action. Dummy workflows should be local component state or explicit practice fixtures.

### 4. Physics Little Alex Horne

Little Alex Horne should become a global decorative physics object rendered by the protected app shell on every `/app/*` route. He should be draggable and flingable, bounce off viewport edges, and have ragdoll-like body-part motion. He is not required to be keyboard accessible and should not be used for required app flows.

The implementation should use a proven browser physics engine for the core simulation. It should respect reduced-motion by settling into a static draggable object or disabling continuous animation. It must avoid blocking normal app pointer interactions except when directly grabbing Little Alex.

### 5. Documentation And QA

Each workstream runs in an independent branch/worktree. Each orchestrator branch owns its docs in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/` and records responsibilities, blockers, work log, QA commands, and achievements.

Merges happen back to `main` in a deliberate order:

1. Coordination docs.
2. Theme and login.
3. Integrated Qwen art.
4. Learn-by-doing guides.
5. Physics Little Alex Horne.

After every merge, run focused verification for the merged feature. After all merges, run full verification: lint, typecheck, Vitest, and Playwright end-to-end tests.

## Non-Goals

This pass does not require server-side persistence for appearance preferences, real Qwen image regeneration during tests, or changing auth/session semantics. It does not make Little Alex part of the accessibility tree or a required control.

## Risks

The physics feature adds a runtime dependency and animation loop, so it needs reduced-motion behavior and performance checks. The guide work touches many pages and can create brittle tests if dummy practice is not well isolated. Theme work can expose hard-coded `bg-white` and `text-white` classes; changes should prioritize shared surfaces and the pages touched by this upgrade rather than rewriting the entire app in one pass.

## Acceptance Criteria

- Pressing Enter in logged-out login fields submits the form.
- Settings exposes `System`, `Light`, and `Dark`; the selected mode persists locally and system mode responds to `prefers-color-scheme`.
- Qwen/OpenAI image prompts no longer request title text, fake card framing, or card-cover layout.
- AI draft review and accepted generated responsibility detail pages show generated art in larger blended panels.
- Feature tours can be exited, but required practice steps must be completed before `Next` enables.
- Practice steps exercise multi-step page workflows, not only buttons inside the guide dialog.
- Little Alex appears on all protected app pages, can be dragged/flung, bounces at viewport edges, and respects reduced motion.
- Final QA includes lint, typecheck, unit/component tests, and Playwright end-to-end tests after all feature branches are merged.
