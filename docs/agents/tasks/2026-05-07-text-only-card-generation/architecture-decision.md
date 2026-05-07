# Architecture Decision

## Superseded

This decision was superseded on 2026-05-07 by `docs/agents/tasks/2026-05-07-ai-card-image-generation/architecture-decision.md`. AI draft input remains text-only, but a successful draft now requires generated cover art again.

## Decision

AI card generation for the Library product flow is text-only.

## Implemented Shape

- Create requests accept JSON text input only.
- Multipart audio capture is rejected before file buffering.
- `ready` means the draft has structured card text fields.
- Contract summaries and details expose text draft data without cover URLs, image prompts, transcripts, or image stages.
- The service no longer calls cover generation or audio transcription from create/retry flows.
- Accepting a generated draft no longer requires cover bytes.
- The regenerate image endpoint is deprecated with `410 Gone`.
- Existing database audio and cover columns remain for compatibility, but they are not part of the product flow.

## Rationale

The feature must not depend on image generation, ACR, ASR, OCR, audio upload, image upload, or cover bytes. Text-only generation keeps the prompt bar responsive, allows independent request cards to fail without blocking future requests, and makes the completion contract match the user-visible card result.

## UI Contract

- Submitting text clears the prompt immediately.
- Each request gets its own compact tracker card with the original prompt and status.
- Clicking a tracker card opens a detail panel with the original prompt, status, structured text result when ready, or error details when failed.
- Retry and cancel are scoped per request.
- Save changes and Put in play remain active for ready generated text cards.
- Track for later is visible but unavailable for generated drafts.
