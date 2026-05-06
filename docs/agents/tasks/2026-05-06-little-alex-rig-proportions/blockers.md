# Blockers

- QA branch expected blocker: `npm run test:e2e -- little-alex-physics.spec.ts` fails on the new wrapper-geometry proportion assertion until the rig proportions branch is merged. Current isolated-branch failure is the reduced-motion head/torso gap: all three presentations report `8.0px`, outside the target `-2..4px` range.
