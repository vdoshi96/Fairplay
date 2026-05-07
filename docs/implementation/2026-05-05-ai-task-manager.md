# AI Task Manager Implementation

## User Flow

AI Task Manager is a Library-first text card creation flow with generated cover art. A user opens `/app/library`, selects `AI Task Manager`, and types a task they want turned into a structured Fairplay card. The app creates an AI card draft, tracks each request independently in the `AI-created cards` section, and lets the user review the generated text and cover before putting it in play.

Ready drafts can be opened in a review panel. The panel loads draft detail, shows the original prompt and structured card fields, supports edits through `PATCH /api/ai-card-drafts/:id`, and creates a responsibility through `Put in play`. Failed drafts stay scoped to their own request card and do not block new prompts.

Generated covers target the current local Library card assets in `public/assets/fairplay/cards/`: 5:7 portrait PNGs with a pale blush full-bleed background, compact black title text, orange vertical labels, a small orange marker, and a rough hand-drawn central household-object illustration.

## API Routes

- `GET /api/ai-card-drafts`: list AI draft summaries for the current household.
- `POST /api/ai-card-drafts`: create from JSON text. Multipart audio is rejected.
- `GET /api/ai-card-drafts/:id`: load draft detail for review.
- `PATCH /api/ai-card-drafts/:id`: save generated field edits before acceptance.
- `POST /api/ai-card-drafts/:id/retry`: retry failed generation.
- `POST /api/ai-card-drafts/:id/regenerate-image`: deprecated; returns `410 Gone`.
- `POST /api/ai-card-drafts/:id/put-in-play`: atomically create a responsibility and accept the draft.
- `POST /api/ai-card-drafts/:id/cancel`: cancel the draft.
- `GET /api/ai-card-drafts/:id/cover`: streams the persisted generated cover image bytes.

All routes use the Node.js runtime, the current server session, household scoping, and existing `{ error }` response conventions.

## Qwen Environment

Required text-generation variables are listed in `.env.example`:

- `QWEN_CARD_MODEL=qwen3.6-max-preview`
- `QWEN_OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- `QWEN_CARD_API_KEY`

The card key is used for Qwen OpenAI-compatible text structuring. The image key is used for Qwen card-cover generation. No Qwen keys are exposed to client components. The Library card-generation path does not call ASR, OCR, ACR, audio, or upload APIs.

Required image-generation variables are also listed in `.env.example`:

- `QWEN_IMAGE_MODEL=qwen-image-2.0-pro`
- `QWEN_IMAGE_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1`
- `QWEN_IMAGE_API_KEY`

## OpenAI Fallback

Qwen remains the primary provider for text structuring and cover generation. When `AI_PROVIDER_FALLBACK_ENABLED=true`, the failed text or image step falls back to OpenAI after Qwen throws.

Required fallback variables:

- `AI_PROVIDER_FALLBACK_ENABLED=true`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_TEXT_MODEL=gpt-5-nano`
- `OPENAI_TEXT_API_KEY`
- `OPENAI_IMAGE_MODEL=gpt-image-1-mini`
- `OPENAI_IMAGE_API_KEY`

OpenAI card structuring uses strict JSON schema output and the same card validation as Qwen. Optional image fallback uses `OPENAI_IMAGE_MODEL` and `OPENAI_IMAGE_API_KEY` when enabled.

## Request State

Submitting a prompt clears the prompt bar immediately and adds a compact optimistic request card. Each request tracks its own status, generated result, retry action, cancel action, and error details. A failed request remains reviewable and retryable without blocking future prompts.

The public contract exposes `queued`, `structuring`, `ready`, and `failed` stages. Internal image-generation stages are mapped to `structuring` when summaries are returned.

Ready means structured text fields and generated cover bytes have both been saved. A retry of a failed draft with existing text but missing cover bytes regenerates the missing cover before returning to ready.

## Known V1 Limitations

- Generation runs synchronously inside the create/retry request instead of a background queue.
- Generated cover bytes are stored on the draft and served through the local cover route; provider URLs are not persisted as public asset paths.
- The review form uses simple comma-separated inputs for area and hidden-effort keys.
- Failed drafts can be retried or canceled, but prompt-edit retry is not a separate flow yet.
- Accepted AI drafts remain visible in the Library tracker as accepted drafts.
- Track for later is visible but unavailable for generated drafts until a persistent saved-draft list exists.

## Manual Smoke Test

1. Configure database, session, and Qwen env vars in `.env.local`.
2. Run `npm run prisma:migrate`, then `npm run dev`.
3. Log in, select a persona, and open `/app/library`.
4. Create a text draft from `AI Task Manager`.
5. Confirm the prompt bar clears immediately and the request appears in `AI-created cards`.
6. Open `Review`, edit title/summary/CPE fields, save changes, and refresh.
7. Submit a second prompt while the first request is still pending or failed and confirm the second request is not blocked.
8. Force or simulate a failed request, then confirm retry/cancel are scoped to that request card.
9. Put a ready draft in play and confirm navigation to the new responsibility.
