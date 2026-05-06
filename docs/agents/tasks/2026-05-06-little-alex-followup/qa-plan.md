# QA Plan

## Branch QA

- Appearance: `npm test -- src/components/little-alex/little-alex-physics.test.tsx src/components/settings/settings-panel.test.tsx`
- Bounds/idle: `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`
- Gaze/bubble: `npm test -- src/components/little-alex/little-alex-physics.test.tsx` and `npm run test:e2e -- little-alex-physics.spec.ts`

## Final QA

- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run`
- `npm run test:e2e`
- `npm run build`

## Visual QA

- Inspect Little Alex in Settings/Home at desktop and mobile widths.
- Confirm he cannot disappear behind the desktop sidebar.
- Confirm all three appearance variants are visually distinct while keeping the suit and clipboard.
