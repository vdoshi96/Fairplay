# AI Draft Diagnostics

Implemented May 5, 2026.

## Safe Logging Contract

AI generation diagnostics are emitted with the `[fairplay-ai-diagnostics]` prefix and a JSON payload. Safe fields are:

- `requestId`
- `route`
- `draftId`
- `event`
- `stage`
- `provider`
- `model`
- `status`
- `providerRequestId`
- `errorName`
- `errorCode`

Diagnostics must never log prompts, task text, transcripts, context text, audio bytes, API keys, signed or generated image URLs, or raw provider response bodies.

## API Failure Shape

Known generation failures return safe JSON:

```json
{
  "error": "AI card draft generation failed.",
  "code": "GENERATION_FAILED",
  "requestId": "fp_ai_...",
  "draftId": "550e8400-e29b-41d4-a716-446655440011"
}
```

The client uses `code` rather than HTTP status to decide when to refresh the draft list after a persisted failed draft.

## Finding Request IDs

In Vercel logs, search for the prefix `[fairplay-ai-diagnostics]`, then filter by the `requestId` value shown to the user, such as `fp_ai_abc123`. Provider request ids are included only when the provider returns a safe request id header.

## Verification

Verified from `/Users/vishal/Developer/Fairplay/.worktrees/ai-draft-diagnostics`:

```bash
npx vitest run src/server/ai/diagnostics.test.ts src/server/ai/card-generator.test.ts src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts src/app/api/ai-card-drafts/[id]/route.test.ts src/components/library/ai-task-manager.test.tsx
npm run typecheck
npm run lint
npx vitest run
```

Results:

- Focused diagnostics suite: 8 files, 95 tests passed.
- Typecheck: passed.
- Lint: passed.
- Full Vitest suite: 85 files, 408 tests passed.
