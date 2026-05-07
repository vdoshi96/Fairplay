# Architecture Decision

## Decision

AI draft creation remains text-input-only, but a successful generated draft now requires both structured card text and a persisted generated cover image.

## Request State

- `queued` and `generating` cover the early text flow.
- Internal service stages include `generating_image` and `saving_image` before the public draft is marked `ready`.
- Failed drafts may be retried. If structured text already exists but cover bytes are missing, retry only regenerates the missing cover instead of discarding the text draft.

## Cover Storage

The repository persists generated cover bytes and MIME type on the draft. Contracts expose a nullable `coverAssetPath`, and the cover route streams the persisted image from `/api/ai-card-drafts/:id/cover`.

## Provider Strategy

Qwen remains the preferred image provider through `QWEN_IMAGE_*` environment variables. OpenAI image generation remains a fallback when the Qwen image path is not configured.

## Style Target

Generated covers target the current local Library asset style:

- 5:7 portrait PNG.
- Full-bleed pale blush/pink background.
- Small uppercase black serif/typewriter title near the top right.
- Orange vertical category labels.
- Small orange lower-left marker.
- Centered rough hand-drawn household object illustration with black outlines and limited orange/yellow fills.

## Safety Boundary

The prompt asks for an original card in the local Library style, not a copied source card, public deck replica, workbook screenshot, Trello screenshot, logo, or watermarked asset.
