# Final Implementation Summary: AI Card Generation Recovery

Date: 2026-05-07

## Summary

The stuck failed/canceled AI-created card state is fixed by separating lifecycle cancel from cleanup. Failed drafts can now be retried or removed. Canceled failed drafts can now be removed. Retry also recovers a backend edge case where a failed draft already had generated text fields.

## User Impact

- A failed text-only AI card draft no longer dead-ends.
- Users can retry persisted failed drafts.
- Users can remove failed or canceled drafts from the tracker.
- Removing a failed/canceled persisted draft deletes it through the server instead of hiding it only in local component state.
- The UI no longer exposes `Cancel` as the cleanup action for failed drafts.

## Implementation Notes

- Added `deleteAiCardDraft` to the repository with household/status guards.
- Added `aiCardDraftService.discard`.
- Added `DELETE /api/ai-card-drafts/:id`.
- Updated `AiTaskManager` tracker/review actions for failed, canceled, processing, ready, and accepted states.
- Added local-only failed draft cleanup for failures that never reached persisted draft creation.
- Added immediate retry response reconciliation so the review panel updates to ready content without waiting for `router.refresh()`.
- Updated retry service behavior to avoid re-saving complete generated text fields while the draft is in a failed lifecycle state.

## Rollback Instructions

If this change must be rolled back:

1. Revert the repository/service/API discard additions.
2. Revert failed/canceled UI actions from `Remove` back to the previous behavior.
3. Revert the retry generated-fields shortcut if it is implicated.
4. Re-run the AI draft focused test suite.

Expected rollback consequence: persisted canceled/failed drafts can become stuck again.

## Blockers

- No local code blocker remains.
- Live provider validation was not run.
- GitHub PR merge/sync was not completed in this local pass.

## Future Recommendations

- Add a staging smoke checklist for Qwen text generation and optional OpenAI text fallback.
- Track the right-side dark block seen in the desktop review screenshot as a separate visual/layout issue if reproducible.
- Consider a soft-delete/archive column for AI drafts if product wants auditability instead of hard deletion.
- Keep the text-only contract protected from legacy audio/image generation assumptions.
