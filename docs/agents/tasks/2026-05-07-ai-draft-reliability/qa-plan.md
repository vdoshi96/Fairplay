# QA Plan

## Focused Regression

- Run provider generator tests:
  - `src/server/ai/qwen-card-generator.test.ts`
  - `src/server/ai/openai-card-generator.test.ts`
- Run provider-neutral fallback tests:
  - `src/server/ai/card-generator.test.ts`
- Run config tests:
  - `src/server/ai/openai-config.test.ts`
- Run AI draft service/API tests:
  - `src/server/ai-card-drafts/service.test.ts`
  - `src/app/api/ai-card-drafts/route.test.ts`
  - `src/app/api/ai-card-drafts/[id]/route.test.ts`
  - `src/app/api/ai-card-drafts/[id]/cover/route.test.ts`

## Broader Verification

- Run `npm run typecheck`.
- Run `npm run lint` if time allows after focused checks.

## Not Planned

- No live Qwen or OpenAI provider calls. Unit tests use mocked `fetch` and mocked provider-neutral dependencies.
- No browser/UI verification unless another branch asks for backend/API failure shape validation through the UI.
