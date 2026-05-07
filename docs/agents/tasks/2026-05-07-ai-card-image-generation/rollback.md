# Rollback Instructions

## Fast Rollback

Revert the AI card image generation commit. The database schema already contains draft cover fields, so no migration rollback is required.

## Manual Rollback Scope

If a partial rollback is needed, restore these areas:

- Remove `coverAssetPath` from AI draft contracts and affected tests.
- Remove service calls to `generateCardCover` and `saveAiCardDraftCover`.
- Stop copying draft cover paths into accepted responsibilities.
- Remove generated cover previews from `AiTaskManager`.
- Restore provider image prompts to the prior text-only product expectation or disable image generation entirely.

## Operational Mitigation

If Qwen image generation is unstable, unset `QWEN_IMAGE_API_KEY` and configure the OpenAI image fallback, or temporarily revert to the superseded text-only behavior with a clear product note.
