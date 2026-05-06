# Learn-By-Doing Guides

## Responsibilities

- Branch: `codex/fairplay-learn-by-doing-guides`.
- Own guide content, guide completion gating, and page-level dummy practice harnesses.
- Keep `Skip`, `Escape`, and guide exit available.
- Prevent advancing past required practice until every required dummy workflow marker is complete.
- Keep dummy practice local to component state; do not mutate real household data.

## Implementation Notes

- Subagent fallback: no callable subagent/delegation tool was available in this Codex session after tool discovery, so the orchestrator implemented and reviewed directly.
- TDD red was captured first with focused guide/page tests for multi-marker practice, no-real-mutation dummy workflows, and new Library Playwright coverage.
- `GuidePractice` now supports `requiredEventIds`; `GuidedTour` tracks completion by event marker, shows progress, and keeps `Next`/`Done` disabled until all markers are complete.
- During practice steps, `GuidedTour` now uses explicit fixed layers: a non-transparent backdrop blocks live page controls, highlighted live targets remain non-interactive, dummy practice surfaces render above the backdrop, and `Skip`/`Escape` stay available from the coach dialog.
- Load Map practice uses a local dummy board for moving via a menu, editing a dummy card title, trimming a duplicate, and deleting it.
- Library practice uses a local greg/draft workflow: fill dummy request, create dummy draft, review, edit, preview regenerated image, and put the dummy card in play without calling draft APIs.
- Radar practice uses a local dummy item for create, edit, visibility, defer, schedule, resolve, and dismiss.
- Check-in practice uses a local agenda workflow for preview, owner assignment, decision recording, deferral, and dummy completion.
- Settings practice uses local-only controls for appearance mode, welcome replay, persona confirmation, and learning hub location.
- Review blocker fixes on 2026-05-06:
  - Practice backdrop/background clicks no longer pass through to live production controls; regression coverage also verifies `Skip` and `Escape` still call guide exit.
  - Load Map delete-before-trim now completes trim credit before delete credit, so the required dummy workflow cannot dead-end when actions happen out of order.
  - Guide and dummy practice surfaces now use theme-aware `--fp-surface-*` tokens and elevated z-index layers instead of hard-coded `bg-white`/`text-white` practice styling.

## Blockers And Risks

- No current review-blocker QA command is blocked. The default Playwright port `3101` was free for the 2026-05-06 rerun, and `npm run test:e2e -- guided-learning.spec.ts` passed against this worktree.
- Merge risk remains moderate because this branch touches shared feature pages also owned by theme/art branches. Merge after foundational theme and art work as planned.
- Baseline note preserved: full Vitest previously timed out only under four-way parallel contention; rerun of timed-out suites passed: `card-templates` 4/4 and `ai-card-drafts` 12/12.

## Achievements

- Replaced coach-dialog-only practice with page-level dummy workflows across Load Map, Library, Radar, Check-ins, and Settings.
- Added tests proving required practice cannot advance until all required page-level markers complete.
- Added no-real-mutation tests for dummy workflows with production callbacks/fetches stubbed and asserted unused.
- Updated guided-learning Playwright coverage to complete the Library dummy workflow before advancing.

## QA Command Outputs

### RED: Review Blocker Regression Tests

Command:

```bash
npm test -- src/components/guide/guided-tour.test.tsx src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx
```

Output excerpt:

```text
Test Files  6 failed (6)
Tests  8 failed | 55 passed (63)
Failures included:
- GuidedTour practice overlay still had `pointer-events-none`.
- Guide dialog still used `bg-white`.
- Dummy Library/Radar/Check-in/Settings/Load Map practice regions were not elevated/theme-aware.
- Load Map delete-before-trim could not reach the completion message.
```

### GREEN: Requested Component Tests

Command:

```bash
npm test -- src/components/guide/guided-tour.test.tsx src/components/guide/guide-content.test.ts src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/library/ai-task-manager.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx
```

Output:

```text
Test Files  8 passed (8)
Tests  76 passed (76)
Duration  1.99s
```

### Lint

Command:

```bash
npm run lint
```

Output:

```text
> fairplay@0.1.0 lint
> eslint .
```

Exit code: `0`.

### Typecheck

Command:

```bash
npm run typecheck
```

Output:

```text
> fairplay@0.1.0 typecheck
> tsc --noEmit
```

Exit code: `0`.

### Playwright Guided Learning

Command:

```bash
npm run test:e2e -- guided-learning.spec.ts
```

Output:

```text
Running 1 test using 1 worker
  ✓  1 [chromium] › e2e/guided-learning.spec.ts:11:5 › guided learning surfaces are persistent, skippable, and user-triggered (8.9s)

  1 passed (14.1s)
```

Warnings observed: Next.js inferred the workspace root because multiple lockfiles exist, and Node printed `NO_COLOR`/`FORCE_COLOR` warnings. The test still exited `0`.

### Diff Check

Command:

```bash
git diff --check
```

Output:

```text
<no output>
```

Exit code: `0`.
