# Little Alex Rig QA

## Scope

- Add repeatable visual QA coverage for the Little Alex Qwen sprite rig.
- Exercise all three sprite presentations with reduced motion enabled so wrapper geometry is stable and measurable.
- Keep screenshots available even when the new proportion assertion fails.

## Assertions

- Head and torso must be nearly connected vertically and overlap horizontally enough to read as one figure.
- Legs must begin at the bottom of the torso without a visible detached gap.
- Arms must connect through the upper torso shoulder band.

## Isolated Branch Evidence

- `npx eslint e2e/little-alex-physics.spec.ts` passed.
- `npm run test:e2e -- little-alex-physics.spec.ts` ran and captured all three presentation screenshots.
- The isolated QA branch fails only on the expected old-rig blocker: each presentation reports an `8.0px` head/torso gap, outside the accepted `-2..4px` range.

## Merge Handoff

After merging the rig proportions branch, rerun `npm run test:e2e -- little-alex-physics.spec.ts`. The new geometry assertion should pass alongside the existing Little Alex interaction checks.
