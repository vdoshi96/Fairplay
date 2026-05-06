# QA Plan

## Branch QA

- Appearance: `npm test -- src/components/little-alex/little-alex-physics.test.tsx src/components/settings/settings-panel.test.tsx`
- Bounds/idle: `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`
- Gaze/bubble: `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`

## Final QA

- `npm run prisma:generate` passed.
- `npm run prisma:validate` passed.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm test -- --run` passed with 94 files and 496 tests.
- `npm run test:e2e` passed with 22 browser tests.
- `npm run build` passed.

## Visual QA

- Inspect Little Alex in Settings/Home at desktop and mobile widths.
- Confirm he cannot disappear behind the desktop sidebar.
- Confirm all three appearance variants are visually distinct while keeping the suit and clipboard.

## Visual QA Evidence

- `test-results/little-alex-followup/appearance-neutral.png`
- `test-results/little-alex-followup/appearance-masculine.png`
- `test-results/little-alex-followup/appearance-feminine.png`
- `test-results/little-alex-followup/left-fling-sidebar-safe.png`
