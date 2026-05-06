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
- During practice steps, the fixed guide layer is pointer-transparent while the coach dialog remains interactive. This keeps `Skip` and `Escape` available while letting real page-level dummy controls receive clicks.
- Load Map practice uses a local dummy board for moving via a menu, editing a dummy card title, trimming a duplicate, and deleting it.
- Library practice uses a local greg/draft workflow: fill dummy request, create dummy draft, review, edit, preview regenerated image, and put the dummy card in play without calling draft APIs.
- Radar practice uses a local dummy item for create, edit, visibility, defer, schedule, resolve, and dismiss.
- Check-in practice uses a local agenda workflow for preview, owner assignment, decision recording, deferral, and dummy completion.
- Settings practice uses local-only controls for appearance mode, welcome replay, persona confirmation, and learning hub location.

## Blockers And Risks

- Default Playwright port `3101` is currently occupied by another worktree server at `/Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics`, so the default `npm run test:e2e -- guided-learning.spec.ts` run reused stale code and failed. The same spec passed on isolated port `3102` with a temporary config that was removed afterward.
- Merge risk remains moderate because this branch touches shared feature pages also owned by theme/art branches. Merge after foundational theme and art work as planned.
- Baseline note preserved: full Vitest previously timed out only under four-way parallel contention; rerun of timed-out suites passed: `card-templates` 4/4 and `ai-card-drafts` 12/12.

## Achievements

- Replaced coach-dialog-only practice with page-level dummy workflows across Load Map, Library, Radar, Check-ins, and Settings.
- Added tests proving required practice cannot advance until all required page-level markers complete.
- Added no-real-mutation tests for dummy workflows with production callbacks/fetches stubbed and asserted unused.
- Updated guided-learning Playwright coverage to complete the Library dummy workflow before advancing.

## QA Command Outputs

### RED: Focused TDD Failure

Command:

```bash
npm test -- src/components/guide/guided-tour.test.tsx src/components/guide/guide-content.test.ts src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx
```

Output excerpt:

```text
Test Files  7 failed (7)
Tests  8 failed | 55 passed (63)
Failures included:
- guide-content requiredEventIds expected undefined
- GuidedTour missing Practice progress: 1 of 3
- Library missing Start dummy Library workflow
- Radar missing Start dummy Radar workflow
- Settings missing Start dummy Settings workflow
- Load Map practice Next was not disabled on the practice step before implementation
```

### GREEN: Focused Guide/Page Tests

Command:

```bash
npm test -- src/components/guide src/components/responsibilities/responsibility-load-map.test.tsx src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx src/components/radar/radar-board.test.tsx src/components/check-ins/check-in-flow.test.tsx src/components/settings/settings-panel.test.tsx
```

Output:

```text
Test Files  10 passed (10)
Tests  76 passed (76)
Duration  2.84s
```

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

### Playwright Default Port Attempt

Command:

```bash
npm run test:e2e -- guided-learning.spec.ts
```

Output excerpt:

```text
1) [chromium] › e2e/guided-learning.spec.ts:11:5 › guided learning surfaces are persistent, skippable, and user-triggered
Test timeout of 30000ms exceeded.
waiting for getByRole('dialog', { name: 'Library guide' }).getByRole('button', { name: 'Start dummy Library workflow' })
```

Follow-up diagnosis:

```text
lsof -nP -iTCP:3101 -sTCP:LISTEN
COMMAND   PID   USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
node    77648 vishal   17u  IPv6 ... TCP *:3101 (LISTEN)

lsof -a -p 77648 -d cwd -Fn
p77648
fcwd
n/Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics
```

### Playwright Isolated Current-Branch Run

Command:

```bash
npx playwright test guided-learning.spec.ts --config=playwright.guided-learning.config.ts
```

Output:

```text
Running 1 test using 1 worker
  ✓  1 [chromium] › e2e/guided-learning.spec.ts:11:5 › guided learning surfaces are persistent, skippable, and user-triggered (7.1s)

  1 passed (12.5s)
```

Note: `playwright.guided-learning.config.ts` was a temporary port-3102 config used only to avoid the other worktree's port-3101 server and was removed after the run.
