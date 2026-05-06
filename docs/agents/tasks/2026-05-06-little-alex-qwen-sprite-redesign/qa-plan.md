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

- Playwright captures Little Alex screenshots under `test-results/little-alex-qwen-sprites/neutral.png`, `masculine.png`, and `feminine.png`.
- The visual QA path saves each presentation, asserts the exact sprite paths `/assets/fairplay/little-alex-sprites/{presentation}-{part}.png`, confirms every sprite image is loaded and inside viewport bounds, captures the screenshot, then flings Little Alex and asserts the chat bubble.
- Inspect that feminine has long hair, arms meet torso shoulders, and all variants keep black suit, white shirt, and clipboard after the asset and renderer branches are merged.
- Inspect that sprites stay visible while dragged/flung and do not enter the desktop sidebar.
