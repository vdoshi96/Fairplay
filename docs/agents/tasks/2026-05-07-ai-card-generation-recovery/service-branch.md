# Service Branch

## Scope

- Worktree: `/Users/vishal/Developer/Fairplay/.worktrees/ai-card-recovery-service`
- Branch: `codex/ai-card-recovery-service`
- Owner scope: backend/service AI draft generation flow, AI-card-draft contracts/API routes, and service tests.

## Markdown History Read

- `docs/agents/tasks/2026-05-07-ai-draft-reliability/architecture-decision.md`
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/debugging-log.md`
- `docs/agents/tasks/2026-05-07-text-only-card-generation/architecture-decision.md`
- `docs/agents/tasks/2026-05-07-text-only-card-generation/work-log.md`
- `README.md`

## Data Flow Trace

- `POST /api/ai-card-drafts` accepts JSON text only, rejects multipart, validates `AiCardDraftCreateSchema`, and calls `aiCardDraftService.createFromText`.
- `createFromText` creates a text draft, marks `structuring`, calls the text card generator, saves generated text fields, then marks `ready`.
- If generation throws, `failDraft` saves `status: "failed"` and `generationStage: "failed"` with a safe generic failure message.
- `POST /api/ai-card-drafts/:id/retry` calls `aiCardDraftService.retry`. Retry is allowed only for `failed` drafts.
- `POST /api/ai-card-drafts/:id/cancel` calls `aiCardDraftService.cancel`. Cancel is allowed for `processing`, `ready`, and `failed` drafts and creates a terminal `canceled` state.
- There is no service/API remove or delete surface for persisted AI drafts. The only UI-side removal found is local optimistic-request removal before a POST resolves; persisted drafts use cancel.

## Root Cause

Service retry mishandled a failed draft that already had generated text fields.

This can happen when text structuring and `saveGeneration` succeed but the final ready transition or response path fails afterward. The persisted draft then has enough structured text to recover, but remains `failed`.

Before this branch, `retry` detected those generated fields and then called `saveGeneration` again before marking ready. The repository only permits `saveAiCardDraftGeneration` while status is `processing`, so calling it for a `failed` draft rejects with `INVALID_INPUT`. The service catches that as a generation failure and writes the draft back to `failed`, making Retry ineffective.

## Fix

- Changed `aiCardDraftService.retry` so failed drafts with complete generated text fields skip the redundant generation rewrite and only call `markStage(..., "ready")`.
- Kept the normal retry path unchanged for failed drafts that do not have generated fields; those still re-run text structuring from the original `inputText`.
- Did not add or change removal semantics. Canceled drafts remain terminal because that is the existing service/API contract.

## Reproduction And Tests

- RED: `npm test -- src/server/ai-card-drafts/service.test.ts --run`
  - Failed as expected on `marks failed drafts with existing generated text ready on retry without rewriting generation`.
  - Failure showed `AiCardDraftServiceError: AI card draft generation failed.`
- GREEN: `npm test -- src/server/ai-card-drafts/service.test.ts --run`
  - Passed: 1 file, 19 tests.
- Focused service/API/provider suite: `npm test -- src/contracts/ai-card-drafts.test.ts src/server/ai/card-generation-shared.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' src/server/ai/card-generator.test.ts src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts --run`
  - Passed: 8 files, 95 tests.
- Repository lifecycle suite: `npm test -- src/server/repositories/ai-card-drafts.test.ts --run`
  - Passed: 1 file, 13 tests.
- TypeScript: `npm run typecheck`
  - Passed.

## Files Touched

- `src/server/ai-card-drafts/service.ts`
- `src/server/ai-card-drafts/service.test.ts`
- `docs/agents/tasks/2026-05-07-ai-card-generation-recovery/service-branch.md`

## Rollback Instructions

- Revert the retry-path change in `src/server/ai-card-drafts/service.ts` to restore the previous behavior of re-saving generated fields before marking ready.
- Remove the regression test in `src/server/ai-card-drafts/service.test.ts`.
- Remove this service branch note if rolling the task branch back completely.

## Unresolved Risks

- Persisted `canceled` drafts still cannot be retried by design.
- There is no persisted draft delete/remove API. If product wants "remove" to mean disappear from the tracker instead of terminal cancel, integration should add a backend delete/archive contract and matching UI action in a separate coordinated branch.
- A cancel racing with an in-flight create can still leave the POST caller seeing an error from the aborted lifecycle, although the repository blocks late writes from changing the canceled draft.
