# Fairplay Interaction Upgrades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved interaction upgrades across isolated branches and merge them back to `main` with full QA.

**Architecture:** Each workstream owns one branch and one worktree. Shared contracts are documented here; implementation branches must not edit another branch's owned files except when resolving merge integration. Main receives branches in the order listed below.

**Tech Stack:** Next.js App Router, React 19, Tailwind CSS variables, Vitest, Testing Library, Playwright, and Matter.js for the Little Alex physics simulation.

---

## Branches And Ownership

- `codex/fairplay-theme-login`: theme provider, Settings appearance control, login Enter regression tests.
- `codex/fairplay-integrated-qwen-art`: image prompts, AI draft review layout, accepted responsibility generated art plumbing.
- `codex/fairplay-learn-by-doing-guides`: guide model, practice harnesses, dummy workflows, guide content, guide tests.
- `codex/fairplay-little-alex-physics`: Matter.js dependency, global physics component, app shell insertion, tests.

## Task 1: Theme And Login

**Files:**

- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: `src/components/settings/settings-panel.test.tsx`
- Modify: `src/components/auth/auth-forms.test.tsx`
- Modify: `e2e/auth-onboarding.spec.ts`
- Create: `src/components/theme/theme-provider.tsx`
- Create: `src/components/theme/theme-provider.test.tsx`

- [ ] Write failing tests for Enter-submit login and Settings appearance controls.

```tsx
it("submits login when Enter is pressed in a logged-out password field", async () => {
  const onAuthenticated = vi.fn();
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ requiresPersonaSelection: true })));
  render(<LoginForm onAuthenticated={onAuthenticated} />);

  fireEvent.change(screen.getByLabelText("Household username"), {
    target: { value: "river-home" }
  });
  fireEvent.change(screen.getByLabelText("Household password"), {
    target: { value: "correct horse battery staple" }
  });
  fireEvent.keyDown(screen.getByLabelText("Household password"), {
    key: "Enter",
    code: "Enter"
  });

  await waitFor(() => expect(onAuthenticated).toHaveBeenCalledTimes(1));
});
```

- [ ] Run `npm test -- src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx` and verify the new tests fail for missing theme controls/provider behavior.
- [ ] Implement `ThemeProvider` with `localStorage` key `fairplay:theme-mode`, root `data-theme` values `light` and `dark`, and root `data-theme-mode` values `system`, `light`, and `dark`.
- [ ] Add dark CSS variables in `src/app/globals.css` under `html[data-theme="dark"]`.
- [ ] Add an Appearance section to Settings using `SegmentedControl<"system" | "light" | "dark">`.
- [ ] Add a small no-flash initialization script or provider initialization in `src/app/layout.tsx`.
- [ ] Run focused tests until green.
- [ ] Run `npm run lint`, `npm run typecheck`, and `npm test -- src/components/auth/auth-forms.test.tsx src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx`.
- [ ] Record results in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/theme-login.md`.

## Task 2: Integrated Qwen Art

**Files:**

- Modify: `src/server/ai/card-generation-shared.ts`
- Modify: `src/server/ai/qwen-card-generator.ts`
- Modify: `src/server/ai/qwen-card-generator.test.ts`
- Modify: `src/server/ai/openai-card-generator.test.ts`
- Modify: `src/contracts/responsibilities.ts`
- Modify: `src/contracts/responsibilities.test.ts`
- Modify: `src/server/repositories/responsibilities.ts`
- Modify: `src/server/repositories/ai-card-drafts.test.ts`
- Modify: `src/app/app/responsibilities/[id]/page.tsx`
- Modify: `src/components/library/ai-task-manager.tsx`
- Modify: `src/components/library/ai-task-manager.test.tsx`
- Modify: `src/components/cards/card-detail-sheet.tsx`
- Modify: `src/components/cards/card-detail-sheet.test.tsx`
- Modify: `e2e/guided-learning.spec.ts` or create `e2e/generated-art.spec.ts`

- [ ] Write failing prompt tests proving `buildImagePrompt()` contains `textless app illustration`, `large central silhouette`, and does not contain `Title:` or `title text near the top`.
- [ ] Write failing responsibility detail tests proving `sourceCoverAssetPath` is exposed and used before source-card title matching for accepted AI responsibilities.
- [ ] Write failing component tests proving AI review uses a large art panel class/test id and CardDetailSheet renders generated cover art larger than legacy source covers.
- [ ] Run focused tests and verify failures are from missing implementation.
- [ ] Update image prompt wording to integrated textless app illustration, raise Qwen image size to `1460*2044`, and preserve 5:7 validation.
- [ ] Add `sourceCoverAssetPath` to `ResponsibilityDetailSchema`, repository mapping, and detail page `detailCardFor()`.
- [ ] Rework `AiCardReviewPanel` layout to use a larger blended art region: desktop grid near `minmax(320px,42vw)` for art and content beside it; mobile art first with enough height.
- [ ] Rework `CardDetailSheet` to use a larger generated-art treatment for `sourceCoverAssetPath` while preserving source-card cover compatibility.
- [ ] Run focused tests, lint, typecheck, and any generated-art Playwright smoke.
- [ ] Record results in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/integrated-qwen-art.md`.

## Task 3: Learn-By-Doing Guides

**Files:**

- Modify: `src/components/guide/guide-content.ts`
- Modify: `src/components/guide/guided-tour.tsx`
- Modify: `src/components/guide/guided-tour.test.tsx`
- Modify: `src/components/responsibilities/responsibility-load-map.tsx`
- Modify: `src/components/responsibilities/responsibility-load-map.test.tsx`
- Modify: `src/components/library/ai-task-manager.tsx`
- Modify: `src/components/library/ai-task-manager.test.tsx`
- Modify: `src/components/radar/radar-board.tsx`
- Modify: `src/components/radar/radar-board.test.tsx`
- Modify: `src/components/check-ins/check-in-flow.tsx`
- Modify: `src/components/check-ins/check-in-flow.test.tsx`
- Modify: `src/components/settings/settings-panel.tsx`
- Modify: `src/components/settings/settings-panel.test.tsx`
- Modify: `e2e/guided-learning.spec.ts`

- [ ] Write failing tests that required practice steps cannot advance until the actual page-level dummy workflow dispatches completion.
- [ ] Extend guide practice events to support multi-step practice state where one guide step can require several completion markers.
- [ ] Implement Load Map dummy practice for moving and trimming/removing a dummy card in local state.
- [ ] Implement Library dummy practice for opening capture, filling text, reviewing a dummy draft, editing fields, and completing dummy put-in-play.
- [ ] Implement Radar dummy practice for create, visibility choice, defer/schedule, resolve, and dismiss/delete local practice items.
- [ ] Implement Check-ins dummy practice for agenda preview, assignment/decision, deferral, and completion summary.
- [ ] Implement Settings dummy practice for theme mode change, welcome replay status, persona confirmation open, and learning hub location.
- [ ] Keep `Skip` and Escape exit behavior.
- [ ] Run focused tests after each page harness, then run `npm test -- src/components/guide src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/ai-task-manager.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx`.
- [ ] Run `npm run test:e2e -- guided-learning.spec.ts`.
- [ ] Record results in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/learn-by-doing-guides.md`.

## Task 4: Physics Little Alex Horne

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/components/app-shell/app-shell.tsx`
- Modify: `src/components/app-shell/app-shell.test.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/little-alex/little-alex-physics.tsx`
- Create: `src/components/little-alex/little-alex-physics.test.tsx`
- Create: `e2e/little-alex-physics.spec.ts`

- [ ] Add `matter-js` and its type package if needed.
- [ ] Write failing tests that `AppShell` renders Little Alex on standard and immersive routes.
- [ ] Write failing reduced-motion tests proving continuous physics does not start when `prefers-reduced-motion: reduce` matches.
- [ ] Implement a Matter.js scene with a torso, head, arms, legs, constraints, viewport walls, drag/flick pointer control, and resize-boundary updates.
- [ ] Render the physics canvas or DOM overlay fixed outside `<main>` with `pointer-events: none` on the shell and `pointer-events: auto` only on the grab target.
- [ ] Add Playwright smoke coverage for drag/fling and viewport containment.
- [ ] Run focused tests, lint, typecheck, and `npm run test:e2e -- little-alex-physics.spec.ts`.
- [ ] Record results in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/little-alex-physics.md`.

## Merge And Final QA

- [ ] Merge `codex/fairplay-theme-login` into `main`, then run focused auth/settings/theme tests.
- [ ] Merge `codex/fairplay-integrated-qwen-art` into `main`, then run focused AI/art/responsibility tests.
- [ ] Merge `codex/fairplay-learn-by-doing-guides` into `main`, then run guide and page-practice tests.
- [ ] Merge `codex/fairplay-little-alex-physics` into `main`, then run app shell and physics tests.
- [ ] Run final full QA from `main`:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

- [ ] Record final merge QA in `docs/agents/tasks/2026-05-06-fairplay-interaction-upgrades/final-qa.md`.
