# Work Log

## 2026-05-07

- Read the prior AI Task Manager implementation notes, text-only architecture decision, deployment docs, provider code, repository code, route tests, UI tests, and current Library asset files.
- Created integration branch `codex/ai-card-image-generation`.
- Created sidecar worktrees for backend and UI/QA branch managers.
- Added red tests for missing cover path contracts, missing cover generation stages, missing repository cover propagation, stale Qwen prompt expectations, and missing UI cover rendering.
- Restored cover generation in the AI draft service while keeping text input only.
- Added contract-level cover path exposure.
- Added repository cover-path serialization and acceptance propagation.
- Rendered generated cover images in tracker cards and review panels.
- Retargeted Qwen and OpenAI image prompts to current Library card assets.
- Updated README, local development docs, AI Task Manager implementation notes, and task documentation.

## Test Commands Run

- `npm test -- src/contracts/ai-card-drafts.test.ts src/server/ai-card-drafts/service.test.ts src/server/repositories/ai-card-drafts.test.ts src/server/ai/qwen-card-generator.test.ts src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx 'src/app/api/ai-card-drafts/route.test.ts' 'src/app/api/ai-card-drafts/[id]/route.test.ts' 'src/app/api/ai-card-drafts/[id]/cover/route.test.ts' 'src/app/api/ai-card-drafts/[id]/put-in-play/route.test.ts' --run`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run`
- `npm test -- src/server/ai/openai-card-generator.test.ts --run`
- `npm run build`
- `npm run prisma:validate`

## Live Provider Checks

- Qwen broad prompt smoke: did not match current Library assets closely enough.
- Qwen current-Library prompt smoke: closer, but still provider-dependent.
