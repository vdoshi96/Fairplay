# Little Alex Rig Proportions Plan

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans`. Keep branch ownership scoped, do not revert other branches, and record QA evidence under `docs/agents/tasks/2026-05-06-little-alex-rig-proportions/`.

## Branches

- `codex/little-alex-rig-proportions`: body part dimensions, offsets, sprite fit, component unit tests.
- `codex/little-alex-idle-speed`: 50% auto-walk speed reduction and focused tests.
- `codex/little-alex-rig-qa`: e2e/visual QA assertions and final docs.

## Task 1: Rig Proportions

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Modify: `src/app/globals.css`
- Create: `docs/agents/tasks/2026-05-06-little-alex-rig-proportions/rig-proportions.md`

- [ ] Add failing unit coverage for reduced-motion head/torso and torso/leg vertical connection.
- [ ] Keep the existing shoulder overlap coverage green.
- [ ] Adjust part dimensions/offsets and shared pose helpers so the rig assembles naturally.
- [ ] Change sprite fit so square source PNGs fill the rig box rather than shrinking into square content inside tall/narrow parts.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`.

## Task 2: Idle Walk Speed

**Files:**
- Modify: `src/components/little-alex/little-alex-physics.tsx`
- Modify: `src/components/little-alex/little-alex-physics.test.tsx`
- Create: `docs/agents/tasks/2026-05-06-little-alex-rig-proportions/idle-speed.md`

- [ ] Add failing unit coverage that exports or otherwise verifies the idle step constant is 50% of the previous `0.72` value.
- [ ] Reduce idle auto-walk per-frame step to `0.36`.
- [ ] Ensure idle turn distance remains at least 5% of viewport width.
- [ ] Run `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`.

## Task 3: Visual and E2E QA

**Files:**
- Modify: `e2e/little-alex-physics.spec.ts`
- Create/modify: task docs under `docs/agents/tasks/2026-05-06-little-alex-rig-proportions/`

- [ ] Add or refine visual QA checks for connected body proportions in screenshots.
- [ ] Confirm all three variants still load exact sprite paths and stay in bounds.
- [ ] Run `npm run test:e2e -- little-alex-physics.spec.ts`.

## Task 4: Integration

- [ ] Merge branches in order: proportions, speed, QA.
- [ ] Run `npm run prisma:generate`, `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --run`, `npm run test:e2e`, and `npm run build`.
- [ ] Push `main`.
- [ ] Verify local `HEAD` equals `origin/main`.
