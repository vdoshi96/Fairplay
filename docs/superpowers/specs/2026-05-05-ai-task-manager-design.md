# AI Task Manager Design

## Summary

AI Task Manager lets a household create a new Fairplay card from a typed task or recorded voice note. The feature is Library-first: generated cards are created, tracked, reviewed, and accepted in the Card Library before they are put in play as responsibilities on the Load Map.

## Goals

- Let users create a household card from plain language: "make a card for remembering the dog's heartworm meds and refills."
- Support text input and recorded audio input.
- Use Qwen for three AI steps:
  - `qwen3-asr-flash` for server-side audio transcription.
  - `qwen3.6-max-preview` for turning the task into structured card fields.
  - `qwen-image-2.0-pro` for generating the card front.
- Match the current in-app Library cover style closely while using only cleared in-repo references and original prompt instructions.
- Show a persistent tracker so users know whether created cards are generating, ready, or failed.
- Keep generated cards editable before they become household responsibilities.
- Delete raw audio when the user accepts or cancels the draft. Retain only the transcript and final card fields after acceptance.

## Non-Goals

- No autonomous recurring task creation.
- No therapy, relationship diagnosis, partner scoring, blame summaries, or unsafe-confrontation prompts.
- No public sharing, marketplace library, or cross-household template publication.
- No long-term storage of raw audio after acceptance/cancellation.
- No client-side exposure of Qwen API keys.

## User Flow

1. User opens `/app/library`.
2. User selects `AI Task Manager` from the Library header.
3. A capture sheet opens with a single prompt box and voice-recording control.
4. User types a task or records audio.
5. The app creates an AI card generation record and shows it in an `AI-created cards` Library section.
6. The server completes generation before opening the card review state:
   - If audio was provided, transcribe it with Qwen ASR.
   - Structure the task with `qwen3.6-max-preview`.
   - Generate the card-front image with `qwen-image-2.0-pro`.
   - Download and persist the temporary generated image instead of storing the provider URL.
7. The tracker shows one of the states: structuring, transcribing, generating image, saving image, ready, failed.
8. Ready drafts show a review sheet with the generated cover, title, summary, hidden effort, cadence, definition/CPE sections, and minimum standard.
9. User can edit fields, retry failed generation, regenerate the image, save the draft, cancel the draft, or put it in play.
10. `Put in Play` creates a `Responsibility`, copies the generated source fields and cover URL, deletes any retained audio, and redirects to the responsibility detail page.

## Library UI

The Library page keeps the existing source card search and label filters. A new `AI Task Manager` primary action appears near the search/header controls.

The `AI-created cards` section appears above the source-card grid. It includes:

- In-progress rows with title or prompt preview, current stage, progress markers, and created time.
- Failed rows with error summary, `Retry`, `Edit prompt`, and `Cancel` actions.
- Ready generated cards with cover image, labels, summary, `Review`, and `Put in Play`.
- Accepted generated cards may remain visible as generated Library cards with an `In play` state.

## Audio Retention

Audio is uploaded to the server because voice input must be available as context for edits before acceptance.

Rules:

- Limit audio uploads to short recordings, with a product cap of 10 MB because Qwen ASR recommends OpenAI-compatible mode for short files up to 10 MB.
- Store raw audio only on the AI card draft record while the draft is not accepted or canceled.
- Delete raw audio when the user puts the card in play, cancels the draft, or explicitly removes the recording.
- Keep transcript text after acceptance because it is useful audit context and much lower risk than raw audio.
- Never return raw audio bytes to the client unless a future design adds explicit playback; v1 does not need playback.

## AI Contracts

### ASR

- Model: `qwen3-asr-flash`.
- Base URL: `QWEN_OPENAI_BASE_URL`.
- API key: `QWEN_CARD_API_KEY`.
- Request shape: OpenAI-compatible `/chat/completions` with `input_audio` content.
- Audio source: Base64 data URL derived from the uploaded file.

### Card Structuring

- Model: `qwen3.6-max-preview`.
- Base URL: `QWEN_OPENAI_BASE_URL`.
- API key: `QWEN_CARD_API_KEY`.
- Input: user text or ASR transcript, plus optional existing draft fields during edit/regenerate.
- Output: strict JSON parsed by Zod.
- Required generated fields:
  - `title`
  - `summary`
  - `areaKeys`
  - `hiddenEffortKeys`
  - `cadence`
  - `definition`
  - `conception`
  - `planning`
  - `execution`
  - `minimumStandard`
  - `imagePrompt`
  - `imageNegativePrompt`

The prompt must keep the tone practical, original, non-clinical, and non-blaming.

### Image Generation

- Model: `qwen-image-2.0-pro`.
- Base URL: `QWEN_IMAGE_BASE_URL`.
- API key: `QWEN_IMAGE_API_KEY`.
- Output size: `500*700` if accepted by the API; otherwise use the nearest supported portrait size and crop/pad consistently in the UI.
- The server downloads the returned image URL immediately and stores the image bytes with content type metadata.
- Store an error state if no image URL is returned.

Image style instructions:

- Match the existing in-app Library card-front style closely: 5:7 portrait cover, warm pale background, simple household-object line drawing, strong black outline, restrained orange/yellow accent palette, title text near the top.
- Use only in-repo approved card covers as references.
- Negative prompt must block copied public source/deck/workbook/Trello style, readable proprietary labels, logos, watermarks, people, partner blame, source card layout mimicry beyond the app's already-shipped cleared reference style, and any gendered chore stereotypes.

## Data Model

Create an `AiCardDraft` persistence model scoped to a household and creator persona.

Core fields:

- `id`
- `householdId`
- `createdByPersonaId`
- `sourceInputType`: `text` or `audio`
- `inputText`
- `audioBytes`
- `audioMimeType`
- `audioTranscript`
- `status`
- `generationStage`
- `failureCode`
- `failureMessage`
- `title`
- `summary`
- `areaKeys`
- `hiddenEffortKeys`
- `cadence`
- `definition`
- `conception`
- `planning`
- `execution`
- `minimumStandard`
- `imagePrompt`
- `imageNegativePrompt`
- `coverImageBytes`
- `coverImageMimeType`
- `acceptedResponsibilityId`
- timestamps for create/update/ready/accepted/canceled/audioDeleted.

Indexes:

- `householdId, status, createdAt`
- `createdByPersonaId`
- `acceptedResponsibilityId`

## API

All API routes require an authenticated selected persona.

- `GET /api/ai-card-drafts`: list drafts for the session household.
- `POST /api/ai-card-drafts`: create and generate a draft from JSON text or multipart audio/text input.
- `GET /api/ai-card-drafts/[id]`: get one draft.
- `PATCH /api/ai-card-drafts/[id]`: edit generated fields.
- `POST /api/ai-card-drafts/[id]/retry`: retry the failed generation stage.
- `POST /api/ai-card-drafts/[id]/regenerate-image`: regenerate only the cover.
- `POST /api/ai-card-drafts/[id]/put-in-play`: create a `Responsibility` from the ready draft and delete audio.
- `POST /api/ai-card-drafts/[id]/cancel`: cancel a draft and delete audio.
- `GET /api/ai-card-drafts/[id]/cover`: stream persisted cover image bytes.

V1 may implement generation synchronously inside the `POST /api/ai-card-drafts` route while still persisting intermediate statuses, because the tracker must show failures and completed drafts. A future queue can move generation out of request/response without changing the UI contract.

## Error Handling

- Missing Qwen configuration returns a safe server error and a failed draft state.
- Invalid Qwen JSON returns failed state with retry.
- Image generation failure keeps the structured text and allows image retry.
- ASR failure keeps a failed draft with retry/cancel.
- Audio too large returns 400 before storage.
- Provider URLs are never exposed as durable cover paths.

## Testing

- Contract tests for draft schemas and enum values.
- Service tests with mocked Qwen fetch calls for text, audio transcription, image success, image failure, retry, and put-in-play.
- Route tests for auth, validation, failure responses, and cover streaming.
- Component tests for Library AI section, capture sheet, tracker states, failed retry actions, ready review, and put-in-play callback.
- Repository integration tests for draft persistence, audio deletion on acceptance/cancellation, and cover byte streaming metadata.

## Environment

Required local/Vercel env vars:

- `QWEN_CARD_MODEL=qwen3.6-max-preview`
- `QWEN_ASR_MODEL=qwen3-asr-flash`
- `QWEN_OPENAI_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- `QWEN_CARD_API_KEY`
- `QWEN_IMAGE_MODEL=qwen-image-2.0-pro`
- `QWEN_IMAGE_BASE_URL=https://dashscope-intl.aliyuncs.com/api/v1`
- `QWEN_IMAGE_API_KEY`

The same card key may be used for ASR and structuring unless a separate ASR key is added later.

## Open Decisions Deferred

- Whether to expire unaccepted drafts automatically after a fixed retention window.
- Whether accepted AI cards remain visible forever in Library or move to an archive state.
- Whether to use Vercel Blob or another durable object store for images/audio after v1.
