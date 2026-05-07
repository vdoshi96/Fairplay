# Learn This Feature Onboarding Fixes

Date: 2026-05-07

## What Was Broken

The feature guide card could render too high in the viewport, especially on Settings and Check-ins, so the instructional copy was clipped while the footer controls remained visible. Settings could also start in the wrong guide context, and Check-ins practice did not clearly explain what the dummy workflow was asking the learner to do.

The Library dummy workflow showed unrelated default content after a learner entered a dummy request. Dummy onboarding UI could remain visible after the guide was skipped, completed, dismissed, or unmounted. Required dummy clicks also lacked a strong visual affordance, so the learner had to infer which action came next.

Crash Course was intentionally left unchanged.

## Branches And Workers

- `codex/onboarding-overlay-positioning`, PR #24: shared overlay positioning, viewport collision handling, and responsive placement.
- `codex/onboarding-settings-checkins-flow`, PR #25: Settings guide routing/content and clearer Check-ins onboarding copy.
- `codex/onboarding-library-draft-generation`, PR #26: temporary Library preview generation from the learner-entered dummy request.
- `codex/onboarding-dummy-cleanup`, PR #27: dummy practice reset/cleanup after guide exit, skip, completion, dismissal, and unmount.
- `codex/onboarding-click-guidance`, PR #28: inline arrow/callout guidance for the next required dummy action.

The implementation followed the controller/worker stack with implementation workers plus spec and code-quality reviewer subagents. Later branches used named workers/reviewers Darwin, Anscombe, James, Harvey, Averroes, Helmholtz, Noether, Aquinas, and Poincare where applicable.

## Files Changed

- `src/components/guide/feature-guide-launcher.tsx`
- `src/components/guide/guide-content.ts`
- `src/components/guide/guide-practice.ts`
- `src/components/guide/guided-tour.tsx`
- `src/components/guide/practice-action-guidance.tsx`
- `src/components/library/ai-task-manager.tsx`
- `src/components/check-ins/check-in-flow.tsx`
- `src/components/settings/settings-panel.tsx`
- `src/components/responsibilities/responsibility-load-map.tsx`
- `src/server/ai-card-drafts/service.ts`
- `src/app/api/ai-card-drafts/onboarding-preview/route.ts`
- Focused tests next to those files.

## Current Flow Behavior

`GuidedTour` now measures the target, dialog, viewport, and active practice surface, then chooses a placement that avoids top clipping and keeps the card inside desktop and mobile viewports. The card has a constrained internal scroll area so explanatory text and footer actions can remain visible. Feature guides are portaled to `document.body` to avoid clipping from feature-specific layout containers.

Settings starts the Settings-specific guide from the Settings launcher. Its first card explains Settings, then the practice workflow walks through appearance, welcome replay, persona confirmation, and learning hub actions without changing account data.

Check-ins starts a Check-ins-specific guide. Its dummy workflow explains that the agenda and outcomes are temporary, then guides the learner through previewing the agenda, assigning a topic, writing and recording a decision, deferring an item, and completing the dummy check-in.

Library dummy generation posts the learner-entered request to `/api/ai-card-drafts/onboarding-preview`. The server reuses the AI card structuring path through `aiCardDraftService.createOnboardingPreview`, does not persist a real draft, and returns a temporary preview for the onboarding review area. The UI shows "Generating a dummy card preview. This can take a moment." while the preview is pending.

Inline `PracticeActionGuidance` callouts now mark required dummy actions with pointer and arrow icons. They sit directly above the target control, scroll into view when active, and avoid overlaying the button. Load Map, Library, Check-ins, and Settings dummy practice actions all use this affordance.

## Dummy State Scope And Cleanup

`guide-practice.ts` now includes reset events. `GuidedTour` dispatches reset events for any started practice workflow when the guide is skipped, completed, dismissed with Escape, or unmounted. Feature surfaces listen for their own practice event IDs and close only their dummy onboarding UI.

Cleanup is intentionally scoped:

- Library closes the temporary practice workflow and unmounts dummy request, preview, save, and put-in-play controls.
- Load Map closes the dummy practice board without closing an unrelated real move menu.
- Check-ins closes dummy agenda/decision state without production mutations.
- Settings closes dummy practice state and the local dummy persona confirmation.

Real workflows remain available after guide cleanup. Greg/Taskmaster, real Library draft actions, real Load Map move menus, Settings actions, and Check-in production callbacks were covered by focused regression tests.

## QA Performed

- Baseline targeted Vitest suite before branch work: 58 tests passed.
- PR #24: `guided-tour.test.tsx`, `npm run typecheck`, `npm run lint`.
- PR #25: `guide-content.test.ts`, `feature-guide-launcher.test.tsx`, `settings-panel.test.tsx`, `check-in-flow.test.tsx`, plus typecheck/lint.
- PR #26: `card-library.test.tsx`, `service.test.ts`, `onboarding-preview/route.test.ts`, plus typecheck/lint.
- PR #27: guided tour, Library, Load Map, Check-ins, and Settings focused suite, 70 tests passed, plus typecheck/lint.
- PR #28: Library, Check-ins, Settings, Load Map, guided tour, and feature guide launcher focused suite, 75 tests passed, plus typecheck/lint.

Final full verification should still include lint, typecheck, full Vitest, Prisma validation, build, and Playwright responsive checks from local `main`.

## Known Limitations And Follow-up Risks

- Vercel preview for PR #28 failed before the app build because `prisma migrate deploy` could not reach `db.prisma.io:5432` (`P1001`). Local branch validation passed and the failure was documented on the PR.
- Full DB-backed and browser verification depends on a reachable local or remote Postgres-compatible database.
- The onboarding preview route intentionally generates text structure only; it does not create a real card or permanent cover asset.
