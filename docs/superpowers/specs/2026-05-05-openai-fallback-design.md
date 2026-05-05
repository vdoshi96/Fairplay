# OpenAI Fallback Design

## Summary

AI Task Manager keeps Qwen as the primary provider for audio transcription, card structuring, and card-front generation. When the primary provider fails and `AI_PROVIDER_FALLBACK_ENABLED=true`, the server retries the failed step with OpenAI using separate ASR, text, and image credentials configured in Vercel.

## Goals

- Preserve the existing Qwen-first behavior for normal generation.
- Fall back to OpenAI for task-to-card structuring when Qwen returns an error, empty content, invalid JSON, or invalid structured fields.
- Fall back to OpenAI for card-front image generation when Qwen image creation or image download validation fails.
- Fall back to OpenAI for audio transcription when Qwen ASR fails.
- Use `OPENAI_ASR_MODEL` for transcription fallback, `OPENAI_TEXT_MODEL` for text fallback, and `OPENAI_IMAGE_MODEL` for image fallback.
- Keep fallback selection server-only and never expose provider keys to client components.
- Preserve current draft tracker behavior: users still see failed states if both primary and fallback providers fail.

## Non-Goals

- No UI controls for choosing a provider.
- No provider-specific generated card fields in the client contract.
- No automatic fallback when Qwen succeeds.
- No durable storage of external provider URLs.

## Environment

Required when fallback is enabled:

- `AI_PROVIDER_FALLBACK_ENABLED=true`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_ASR_MODEL=gpt-4o-mini-transcribe`
- `OPENAI_ASR_API_KEY`
- `OPENAI_TEXT_MODEL=gpt-5-nano`
- `OPENAI_TEXT_API_KEY`
- `OPENAI_IMAGE_MODEL=gpt-image-1-mini`
- `OPENAI_IMAGE_API_KEY`

Optional:

- `OPENAI_API_KEY` may be used later if the app wants one shared OpenAI key, but this implementation uses the explicit text and image keys.
- `OPENAI_ORG_ID` and `OPENAI_PROJECT_ID` are not required for the current API calls.

## Provider Flow

### Audio Transcription

1. AI draft service calls a provider-neutral transcription function.
2. The neutral generator calls Qwen ASR first.
3. If Qwen succeeds, return the Qwen transcript.
4. If Qwen fails, resolve OpenAI fallback config.
5. If fallback is disabled, rethrow the Qwen error.
6. If fallback is enabled, call OpenAI Audio Transcriptions with multipart form data and require non-empty returned text.

### Card Structuring

1. AI draft service calls a provider-neutral card generator.
2. The neutral generator calls Qwen card structuring first.
3. If Qwen succeeds, return the Qwen card.
4. If Qwen fails, resolve OpenAI fallback config.
5. If fallback is disabled, rethrow the Qwen error.
6. If fallback is enabled, call OpenAI Responses API with strict JSON schema output.
7. Parse and validate the returned JSON with the same card schema before saving it.

### Image Generation

1. AI draft service calls the same provider-neutral generator for image creation.
2. The neutral generator calls Qwen image generation first.
3. If Qwen succeeds, persist the Qwen image bytes.
4. If Qwen fails, resolve OpenAI fallback config.
5. If fallback is disabled, rethrow the Qwen error.
6. If fallback is enabled, call OpenAI image generation.
7. Prefer base64 image output from GPT image models; support URL output defensively.
8. Validate output MIME and size before saving cover bytes.

## Audio Behavior

Audio capture still sends recorded audio to the server. Qwen ASR remains the primary transcription path. If Qwen ASR fails and fallback is enabled, OpenAI ASR retries with the same recorded bytes and optional context prompt. Raw audio retention and deletion rules do not change.

## Failure Semantics

- Primary success: no fallback call.
- Primary failure plus fallback disabled: original primary error fails the draft.
- Primary failure plus fallback config missing: fallback config error fails the draft so misconfiguration is visible.
- Primary failure plus fallback failure: fallback error fails the draft.
- ASR failure: OpenAI retries only when fallback is enabled; if both providers fail, the draft fails through the existing service path.

## Testing

- Config tests for disabled fallback, enabled fallback, and missing required values.
- OpenAI ASR client tests for multipart transcription request shape and transcript validation.
- OpenAI text client tests for Responses API payload, structured JSON parsing, and validation.
- OpenAI image client tests for GPT image base64 output and safe bytes.
- Provider-neutral wrapper tests proving Qwen-first behavior, fallback-on-failure behavior, and disabled fallback behavior across ASR, text, and image steps.
- Existing AI draft service tests continue to pass through dependency injection.
