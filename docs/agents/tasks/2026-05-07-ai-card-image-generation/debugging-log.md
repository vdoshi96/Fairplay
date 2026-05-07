# Debugging Log

## Symptoms

- AI-created cards moved through structured text generation but surfaced a failure state when no cover image was generated.
- Retrying a failed draft with saved structured text marked it ready without proving that a cover existed.
- Accepted generated cards carried `sourceCoverAssetPath: null`, so the Library/resulting responsibility could not display generated artwork.

## Root Cause

The prior text-only pass intentionally removed cover generation from the create and retry flows. Repository and API cover-storage helpers still existed, but the service no longer called them. Contracts also omitted a `coverAssetPath`, so the UI had no way to know a cover existed even if one was persisted.

## Failed or Superseded Approaches

- The text-only architecture avoided provider image failures but no longer met the product requirement.
- A first live Qwen prompt used the older broad "app illustration" direction and produced a generic framed image that did not match the Library cards.
- The reference PDF was initially considered, but the corrected requirement is to match the current in-app Library card assets instead.

## Fix Strategy

1. Keep text-only input.
2. Generate structured draft text first.
3. Generate a card cover image from the structured draft fields.
4. Persist cover bytes and MIME type before marking the draft ready.
5. Expose `/api/ai-card-drafts/:id/cover` as `coverAssetPath`.
6. Render generated covers in tracker and review states.
7. Copy the cover path into the accepted responsibility.

## Reference IDs

- Live Qwen broad-prompt smoke: `3bfccf8a-4f81-9e90-92a4-83ed11db27ff`.
- Live Qwen current-Library-style smoke: `a3d86280-c9b8-99b1-8ee3-d705c123ea41`.
