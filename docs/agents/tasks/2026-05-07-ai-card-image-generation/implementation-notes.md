# Implementation Notes

## Contracts

- `AiCardDraftSummarySchema` and detail responses now include `coverAssetPath: string | null`.
- The path format is restricted to `/api/ai-card-drafts/:uuid/cover`.

## Service

- `structureAndGenerate` saves generated text, generates a cover, saves the cover, and then marks the draft ready.
- `retry` now handles three cases:
  - Existing text and existing cover: mark ready.
  - Existing text but missing cover: regenerate and save only the cover.
  - Missing text: regenerate text and cover from the original input.

## Repository

- Draft summaries include `coverAssetPath` when persisted cover bytes and MIME type exist.
- Accepting a generated draft copies the draft cover path into the responsibility `sourceCoverAssetPath`.

## UI

- The AI draft tracker renders a compact generated-cover preview when `coverAssetPath` exists.
- The review panel renders the generated cover above editable fields.
- Failure handling remains scoped per draft, with retry/remove available for failed requests.

## Provider Prompt

The shared image prompt was retargeted from generic textless app art to current Library card assets. The prompt cap was raised to preserve the style directive plus task-specific context.
