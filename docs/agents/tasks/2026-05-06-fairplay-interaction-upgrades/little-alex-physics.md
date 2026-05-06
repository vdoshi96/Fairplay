# Little Alex Physics

## Responsibilities

- Own branch `codex/fairplay-little-alex-physics` in worktree `/Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics`.
- Render Little Alex globally from `AppShell` on protected `/app/*` pages, including `/app/crash-course`.
- Keep Little Alex decorative, outside required app flows, and not keyboard-addressable.
- Use a proven physics engine for drag, fling, viewport-edge bounce, and ragdoll-like body part motion.
- Respect `prefers-reduced-motion` by avoiding continuous physics and keeping a static draggable-safe mode.
- Keep normal app interaction unblocked except for the direct grab target.

## Implementation Notes

- Added `matter-js` as a runtime dependency and `@types/matter-js` as a dev dependency.
- Added `LittleAlexPhysics` as a fixed DOM overlay mounted by `AppShell` outside `<main>`.
- The overlay has `pointer-events: none`; only `little-alex-grab-target` uses `pointer-events: auto`.
- The character is rendered as six decorative DOM body parts: head, torso, two arms, and two legs.
- Matter.js drives the normal-mode simulation with a torso, head, limbs, constraints, gravity, restitution, and viewport wall bodies.
- Dragging translates the Matter bodies as a group; release applies pointer velocity back into the bodies for fling behavior.
- Resize updates the Matter wall bodies and clamps bodies back inside the current viewport.
- Reduced-motion mode waits until media preference is resolved after hydration, does not start `Matter.Runner.run`, and uses React state for static dragging.
- Fixed a hydration mismatch discovered in Playwright by making the first render server-safe and starting physics only after motion preference resolution.
- Review fix: viewport measurement now uses the actual browser viewport for Matter wall placement and drag containment instead of clamping the viewport up to `320x480`.
- Review fix: containment now clamps against the whole rendered Little Alex body-part footprint, including rotated physics parts, before syncing DOM positions.

## Subagent / Review Notes

- Required subagent delegation was attempted conceptually, but no Task/subagent tool was exposed in this Codex session. `tool_search` did not expose a general subagent or review-agent tool.
- Fallback: performed a direct diff review after implementation, plus focused unit/component tests, lint, typecheck, `git diff --check`, and Playwright smoke coverage.
- Review finding: no blocking code-quality issues remained after removing an unused constant and fixing the Matter runner mock type.
- Review items addressed on 2026-05-06: P2 virtual viewport bounds and P3 torso-only E2E containment coverage.

## TDD Evidence

Initial red test command:

```text
npm test -- src/components/app-shell/app-shell.test.tsx
```

Red output excerpt:

```text
❯ src/components/app-shell/app-shell.test.tsx (7 tests | 3 failed) 258ms
  ✓ protected app UI > renders the app shell around the real home page 132ms
  ✓ protected app UI > renders premium route chrome with active load map and personal-use entries 33ms
  × protected app UI > renders Little Alex as a decorative physics object on standard protected pages 19ms
    → Unable to find an element by: [data-testid="little-alex-horne"]
  × protected app UI > lets the crash course route use the full app canvas 17ms
    → Unable to find an element by: [data-testid="little-alex-horne"]
  × protected app UI > settles Little Alex into a draggable-safe static mode for reduced motion 15ms
    → Unable to find an element by: [data-testid="little-alex-horne"]

Test Files  1 failed (1)
     Tests  3 failed | 4 passed (7)
```

Review red test commands:

```text
npm test -- src/components/little-alex/little-alex-physics.test.tsx -t "actual small viewport"
npm run test:e2e -- little-alex-physics.spec.ts --grep "constrained mobile landscape"
```

Review red output excerpts:

```text
× LittleAlexPhysics > uses the actual small viewport dimensions for physics walls
  → expected wall bodies for 300x260, received wall bodies for 320x480

× Little Alex physics › keeps every body part inside a constrained mobile landscape viewport
  → "head bottom 369.1667175292969 > 260"
  → "torso bottom 432.1703796386719 > 260"
  → "leftLeg bottom 482.4284362792969 > 260"
```

## QA Command Outputs

Focused Vitest:

```text
npm test -- src/components/app-shell/app-shell.test.tsx src/components/little-alex/little-alex-physics.test.tsx

> fairplay@0.1.0 test
> vitest src/components/app-shell/app-shell.test.tsx src/components/little-alex/little-alex-physics.test.tsx

 RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics

 ✓ src/components/little-alex/little-alex-physics.test.tsx (4 tests) 58ms
 ✓ src/components/app-shell/app-shell.test.tsx (7 tests) 270ms

 Test Files  2 passed (2)
      Tests  11 passed (11)
   Start at  09:42:04
   Duration  1.08s (transform 128ms, setup 77ms, collect 324ms, tests 329ms, environment 402ms, prepare 123ms)
```

Lint:

```text
npm run lint

> fairplay@0.1.0 lint
> eslint .
```

Typecheck:

```text
npm run typecheck

> fairplay@0.1.0 typecheck
> tsc --noEmit
```

Playwright smoke:

```text
npm run test:e2e -- little-alex-physics.spec.ts

> fairplay@0.1.0 test:e2e
> playwright test little-alex-physics.spec.ts

[WebServer] (node:115) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)
[WebServer]  ⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
[WebServer]  We detected multiple lockfiles and selected the directory of /Users/vishal/Developer/Fairplay/package-lock.json as the root directory.
[WebServer]  To silence this warning, set `outputFileTracingRoot` in your Next.js config, or consider removing one of the lockfiles if it's not needed.
[WebServer]    See https://nextjs.org/docs/app/api-reference/config/next-config-js/output#caveats for more information.
[WebServer]  Detected additional lockfiles:
[WebServer]    * /Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics/package-lock.json
[WebServer]
[WebServer] (node:149) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
[WebServer] (Use `node --trace-warnings ...` to show where the warning was created)

Running 4 tests using 1 worker

(node:42790) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:42790) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › e2e/little-alex-physics.spec.ts:155:7 › Little Alex physics › appears globally on standard and immersive protected app routes (4.5s)
  ✓  2 [chromium] › e2e/little-alex-physics.spec.ts:184:7 › Little Alex physics › can be dragged and flung while staying inside the viewport (3.3s)
  ✓  3 [chromium] › e2e/little-alex-physics.spec.ts:210:7 › Little Alex physics › keeps every body part inside a constrained mobile landscape viewport (3.1s)
  ✓  4 [chromium] › e2e/little-alex-physics.spec.ts:226:7 › Little Alex physics › uses a static draggable-safe mode with reduced motion (2.1s)

  4 passed (16.9s)
```

Diff hygiene:

```text
git diff --check
```

No output; exit code 0.

## Blockers And Risks

- No active blocker.
- Subagent/review delegation tool was unavailable; fallback review is documented above.
- Playwright reports a non-blocking Next.js workspace-root warning because the parent repo and this worktree both have lockfiles.
- `npm install` reported 2 moderate audit findings in the existing dependency tree. No audit remediation was attempted because it was outside this workstream.

## Achievements

- Little Alex appears on standard protected app routes and the immersive crash-course route.
- Little Alex remains decorative and absent from keyboard/role-based UI.
- Normal mode uses Matter.js runner, bodies, constraints, velocity, and viewport walls for drag/fling and bounce behavior.
- Reduced-motion mode avoids the continuous Matter runner and remains safely draggable.
- Small constrained viewports use real viewport bounds for walls and body-part containment.
- Playwright now checks every visible Little Alex body part, not just the torso.
- Focused component tests, lint, typecheck, diff hygiene, and Playwright smoke all pass.
