# QA Plan

## Focused QA

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
- `npm run test:e2e -- little-alex-physics.spec.ts`
- Visual inspection of `test-results/little-alex-qwen-sprites/neutral.png`, `masculine.png`, and `feminine.png`

## Final QA

- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run`
- `npm run test:e2e`
- `npm run build`
