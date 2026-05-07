# Final QA

## Status

Passed focused backend verification.

## Results

- RED provider regression run: failed as expected before the fix with `QWEN_CONFIG_MISSING` and `OPENAI_FALLBACK_CONFIG_MISSING`.
- GREEN provider regression run: passed after operation-scoped config implementation.
- Focused AI draft/service/API test run: 8 files passed, 109 tests passed.
- Typecheck passed.
- Lint passed.

## Commands

- `npm test -- --run src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts`
- `npm test -- --run src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/ai/card-generator.test.ts src/server/ai/openai-config.test.ts`
- `npm test -- --run src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/ai/card-generator.test.ts src/server/ai/openai-config.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' 'src/app/api/ai-card-drafts/[id]/cover/route.test.ts'`
- `npm run typecheck`
- `npm run lint`

## Not Run

- Live provider calls with real Qwen/OpenAI keys.
- Full Playwright suite. This branch is backend/provider configuration scoped.
