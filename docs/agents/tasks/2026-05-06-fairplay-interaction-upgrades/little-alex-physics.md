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

## Subagent / Review Notes

- Required subagent delegation was attempted conceptually, but no Task/subagent tool was exposed in this Codex session. `tool_search` did not expose a general subagent or review-agent tool.
- Fallback: performed a direct diff review after implementation, plus focused unit/component tests, lint, typecheck, `git diff --check`, and Playwright smoke coverage.
- Review finding: no blocking code-quality issues remained after removing an unused constant and fixing the Matter runner mock type.

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

## QA Command Outputs

Focused Vitest:

```text
npm test -- src/components/app-shell/app-shell.test.tsx src/components/little-alex/little-alex-physics.test.tsx

> fairplay@0.1.0 test
> vitest src/components/app-shell/app-shell.test.tsx src/components/little-alex/little-alex-physics.test.tsx

 RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-little-alex-physics

 ✓ src/components/little-alex/little-alex-physics.test.tsx (3 tests) 52ms
 ✓ src/components/app-shell/app-shell.test.tsx (7 tests) 261ms

 Test Files  2 passed (2)
      Tests  10 passed (10)
   Start at  09:30:03
   Duration  996ms (transform 123ms, setup 69ms, collect 298ms, tests 313ms, environment 395ms, prepare 78ms)
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

Running 3 tests using 1 worker

(node:292) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:292) Warning: The 'NO_COLOR' env is ignored due to the 'FORCE_COLOR' env being set.
(Use `node --trace-warnings ...` to show where the warning was created)
  ✓  1 [chromium] › e2e/little-alex-physics.spec.ts:115:7 › Little Alex physics › appears globally on standard and immersive protected app routes (4.0s)
  ✓  2 [chromium] › e2e/little-alex-physics.spec.ts:144:7 › Little Alex physics › can be dragged and flung while staying inside the viewport (2.8s)
  ✓  3 [chromium] › e2e/little-alex-physics.spec.ts:170:7 › Little Alex physics › uses a static draggable-safe mode with reduced motion (2.0s)

  3 passed (13.9s)
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
- Focused component tests, lint, typecheck, diff hygiene, and Playwright smoke all pass.
