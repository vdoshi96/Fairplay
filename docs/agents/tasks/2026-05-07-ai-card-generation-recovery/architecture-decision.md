# Architecture Decision: Failed And Canceled AI Draft Recovery

Date: 2026-05-07

## Decision

Add a persisted discard path for terminal failed/canceled AI card drafts, and keep retry behavior focused on text-only draft recovery.

## Rationale

Cancel is a lifecycle transition, not cleanup. Using cancel to dismiss a failed draft created a confusing terminal state that stayed visible in the tracker. The correct user action for failed/canceled clutter is remove. Because these drafts are persisted and listed by the server, the remove action must be backed by a service/repository/API contract rather than a client-only filter.

## Contract

- `DELETE /api/ai-card-drafts/:id`
  - Requires authentication and a selected persona.
  - Requires a UUID draft id.
  - Calls `aiCardDraftService.discard`.
  - Returns `{ "ok": true }` on success.

## Service Rules

- `discard(session, draftId)` loads the draft in the current household.
- Only `failed` and `canceled` drafts are discardable.
- `processing`, `ready`, and `accepted` drafts are rejected.
- Ownership and selected-persona checks follow the same pattern as other AI draft operations.

## Repository Rules

- `deleteAiCardDraft` uses `deleteMany` scoped by `id`, `householdId`, and `status in ["failed", "canceled"]`.
- If no row is deleted and the draft exists in the household, the repository returns `INVALID_INPUT`.
- If the draft does not exist in the household, the repository returns `NOT_FOUND`.

## UI Rules

- Failed persisted drafts expose `Retry` and `Remove`.
- Failed local-only drafts expose `Remove` only, because there is no server draft to retry.
- Canceled drafts expose `Remove`.
- Processing drafts retain `Cancel`.
- Ready drafts retain `Review` and `Put in play`.
- Accepted drafts remain visible as accepted history.

## Retry Recovery

Retry keeps two paths:

1. Failed drafts with complete generated text fields skip text generation and move directly to `ready`.
2. Failed drafts without generated fields rerun the text structuring provider from `inputText`.

The service must not call media generation or require media provider configuration in either path.

## Privacy And Safety

- Error messages remain safe and generic.
- Diagnostics should continue to use request IDs without logging prompts, generated card content, raw provider bodies, API keys, or household-private details.

## Rollback

To rollback this decision:

1. Remove the UI `Remove` action for failed/canceled drafts.
2. Remove `DELETE /api/ai-card-drafts/:id`.
3. Remove `aiCardDraftService.discard` and `deleteAiCardDraft`.
4. Remove related tests.

This rollback would restore the stuck canceled/failed state, so it should only be used if the delete contract itself causes a production issue.
