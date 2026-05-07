# Final QA

## Status

Passed focused verification.

## Results

- Focused AI card generation/API/UI/repository/provider tests passed: 12 files, 123 tests.
- Typecheck passed.
- Lint passed.

## Commands

- `npm test -- src/contracts/ai-card-drafts.test.ts src/server/ai/card-generation-shared.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx src/components/guide/guide-content.test.ts src/server/ai/card-generator.test.ts src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts --run`
- `npm test -- src/server/repositories/ai-card-drafts.test.ts --run`
- `npm test -- src/contracts/ai-card-drafts.test.ts src/server/ai/card-generation-shared.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx src/components/guide/guide-content.test.ts src/server/ai/card-generator.test.ts src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/repositories/ai-card-drafts.test.ts --run`
- `npm run typecheck`
- `npm run lint`

## Not Run

- Live AI provider calls.
- Full Playwright/browser suite.
