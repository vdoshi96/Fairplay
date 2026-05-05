# AI Task Manager Implementation

## User Flow

AI Task Manager is a Library-first card creation flow. A user opens `/app/library`, selects `AI Task Manager`, and either types a task or records a short voice note. The app creates an AI card draft, tracks generation in the `AI-created cards` section, and lets the user review the generated card before putting it in play.

Ready drafts can be opened in a review panel. The panel loads draft detail, shows the generated cover and structured card fields, supports edits through `PATCH /api/ai-card-drafts/:id`, supports cover regeneration, and creates a responsibility through `Put in play`.

## API Routes

- `GET /api/ai-card-drafts`: list AI draft summaries for the current household.
- `POST /api/ai-card-drafts`: create from JSON text or multipart audio.
- `GET /api/ai-card-drafts/:id`: load draft detail for review.
- `PATCH /api/ai-card-drafts/:id`: save generated field edits before acceptance.
- `POST /api/ai-card-drafts/:id/retry`: retry failed generation.
- `POST /api/ai-card-drafts/:id/regenerate-image`: regenerate the cover image.
- `POST /api/ai-card-drafts/:id/put-in-play`: atomically create a responsibility, accept the draft, and delete retained audio.
- `POST /api/ai-card-drafts/:id/cancel`: cancel the draft and delete retained audio.
- `GET /api/ai-card-drafts/:id/cover`: stream persisted cover bytes with defensive raster MIME and no-sniff headers.

All routes use the Node.js runtime, the current server session, household scoping, and existing `{ error }` response conventions.

## Qwen Environment

Required variables are listed in `.env.example`:

- `QWEN_CARD_MODEL=qwen3.6-max-preview`
- `QWEN_ASR_MODEL=qwen3-asr-flash`
- `QWEN_OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- `QWEN_CARD_API_KEY`
- `QWEN_IMAGE_MODEL=qwen-image-2.0-pro`
- `QWEN_IMAGE_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1`
- `QWEN_IMAGE_API_KEY`

The card key is used for Qwen OpenAI-compatible structuring and ASR. The image key is used for Qwen image generation. No Qwen keys are exposed to client components.

## OpenAI Fallback

Qwen remains the primary provider. When `AI_PROVIDER_FALLBACK_ENABLED=true`, audio transcription, card structuring, and card-front image generation fall back to OpenAI only after the matching Qwen step throws.

Required fallback variables:

- `AI_PROVIDER_FALLBACK_ENABLED=true`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_ASR_MODEL=gpt-4o-mini-transcribe`
- `OPENAI_ASR_API_KEY`
- `OPENAI_TEXT_MODEL=gpt-5-nano`
- `OPENAI_TEXT_API_KEY`
- `OPENAI_IMAGE_MODEL=gpt-image-1-mini`
- `OPENAI_IMAGE_API_KEY`

OpenAI ASR uses the Audio Transcriptions API with multipart form data and preserves the short capture context as a transcription prompt. OpenAI card structuring uses the Responses API with strict JSON schema output and the same card validation as Qwen. OpenAI image generation requests a low-cost portrait PNG, validates the returned raster bytes or URL download, and persists only server-owned cover bytes.

## Audio Retention

Voice recordings are uploaded to the server and stored only on the `AiCardDraft` record while the draft is still reviewable. Raw audio is deleted when the user cancels the draft or puts it in play. Accepted drafts retain the transcript and generated card fields, but not the raw audio bytes or audio MIME type.

The route and service cap uploaded audio at 10 MB. The client does not write audio to browser storage. The capture UI stops active microphone tracks when recording stops, the sheet closes, the component unmounts, or a late `getUserMedia` permission request resolves after cancellation.

## Image Persistence

The server sends strict style instructions to Qwen image generation, downloads the temporary provider URL immediately, validates the download, and stores image bytes plus content type on the draft. Durable UI cover paths always use `/api/ai-card-drafts/:id/cover`; provider URLs are not returned as durable card assets.

## Known V1 Limitations

- Generation runs synchronously inside the create/retry request instead of a background queue.
- Covers and audio bytes live in Postgres for v1; Vercel Blob or another object store would be a better fit if generated media volume grows.
- The review form uses simple comma-separated inputs for area and hidden-effort keys.
- Failed drafts can be retried or canceled, but prompt-edit retry is not a separate flow yet.
- Accepted AI drafts remain visible in the Library tracker as accepted drafts.

## Manual Smoke Test

1. Configure database, session, and Qwen env vars in `.env.local`.
2. Run `npm run prisma:migrate`, then `npm run dev`.
3. Log in, select a persona, and open `/app/library`.
4. Create a text draft from `AI Task Manager`.
5. Confirm the draft appears in `AI-created cards`, reaches `Ready`, and has a cover.
6. Open `Review`, edit title/summary/CPE fields, save changes, and refresh.
7. Regenerate the image and confirm the tracker remains usable.
8. Put the draft in play and confirm navigation to the new responsibility.
9. Create a voice draft, then cancel it before acceptance and confirm no raw audio remains on the draft row.
