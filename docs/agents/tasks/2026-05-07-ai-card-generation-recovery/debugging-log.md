# AI Card Generation Recovery Debugging Log

Date: 2026-05-07

## User-Visible Failure

The AI-created card tracker could show a draft with both `Canceled` and `Failed` states. The detail panel preserved `Error details` with "AI card draft generation failed." and offered no effective remove/retry path. The screenshot case used a text prompt:

```text
i want to create a task for taking the recycling out
```

## Reproduction

1. Open `/app/library` with a selected persona.
2. Create a text AI card draft that fails generation.
3. Use the old failed-draft cancel path.
4. Observe that the persisted draft becomes `status: "canceled"` while keeping `generationStage: "failed"` and `failureMessage`.
5. Reopen or refresh the Library.
6. The draft remains visible as canceled/failed and cannot be retried or removed.

## Root Causes

### 1. Cancel Was Used As Cleanup

The UI exposed `Cancel` for failed drafts. Persisted cancel changed the draft to a terminal `canceled` state but did not remove or archive it. Canceled failed drafts were still returned by `listAiCardDrafts`, and the tracker had no action for terminal cleanup.

### 2. No Persisted Discard Contract

There was no repository, service, or route method to remove failed/canceled AI card drafts. The only true client-side removal was for local optimistic drafts before the server request resolved.

### 3. Retry Could Loop Back To Failed

If a failed draft already contained complete generated text fields, `retry` tried to call `saveGeneration` again before marking the draft ready. The repository permits generation saves only while a draft is `processing`, so the service converted that path back into `GENERATION_FAILED`.

### 4. Retry UI Waited On Refresh

The client previously fired retry and then relied on `router.refresh()`. If the refresh lagged, the failed detail panel could stay visible even though the retry response contained the ready draft.

## Fix Summary

- Failed drafts now show `Retry` and `Remove`, not `Cancel`.
- Canceled drafts now show `Remove`.
- A new `DELETE /api/ai-card-drafts/:id` route calls `aiCardDraftService.discard`.
- `discard` only allows failed or canceled drafts owned by the current household/persona.
- The repository deletes only matching failed/canceled rows and rejects ready, processing, or accepted deletion.
- Retry marks failed drafts with existing generated fields ready without re-saving generated content.
- Retry responses reconcile local tracker state immediately, so the detail panel updates to editable ready content without waiting for route refresh.
- Local-only failed drafts can be hidden without a server call.

## Non-Goals

- This fix does not reintroduce image generation, audio capture, ASR, OCR, cover-byte requirements, or regenerate-image.
- This fix does not change accepted draft retention.
- This fix does not perform live Qwen/OpenAI provider validation.

## Temporary State Cleanup

- Visual QA seeded a temporary household/session and two AI drafts in the local database.
- Both seeded failed/canceled drafts were removed through the UI flow during QA.
- The seeded household `807b1dd3-9c41-4470-bbbc-09d49ab7cf3d` was deleted after the final QA pass to avoid leaving local test data behind.
