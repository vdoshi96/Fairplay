# QA Plan

## Focused QA

- `npm run assets:generate-little-alex -- --dry-run`
- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
- `npm run test:e2e -- little-alex-physics.spec.ts`

## Final Regression QA

- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run`
- `npm run test:e2e`
- `npm run build`

## Visual QA

- Capture Little Alex screenshots in neutral, masculine, and feminine settings.
- Inspect that feminine has long hair, arms meet torso shoulders, and all variants keep black suit, white shirt, and clipboard.
- Inspect that sprites stay visible while dragged/flung and do not enter the desktop sidebar.
