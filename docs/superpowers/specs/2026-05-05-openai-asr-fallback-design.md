# OpenAI ASR Fallback Design

## Summary

AI Task Manager keeps Qwen ASR as the primary transcription provider. When Qwen ASR fails and `AI_PROVIDER_FALLBACK_ENABLED=true`, the server retries transcription with OpenAI before continuing the existing task-to-card generation pipeline.

## Goals

- Preserve Qwen-first audio transcription for normal voice capture.
- Fall back to OpenAI speech-to-text only after Qwen ASR throws or returns unusable text.
- Use separate ASR fallback configuration: `OPENAI_ASR_MODEL` and `OPENAI_ASR_API_KEY`.
- Keep text and image fallback behavior unchanged.
- Preserve current draft tracker stages: audio drafts still show `transcribing`, then `structuring`, then image stages.
- Keep raw audio retention/deletion unchanged.
- Send short user-provided context text as an OpenAI transcription prompt when present.

## Non-Goals

- No diarization.
- No audio translation endpoint.
- No client-side provider selection.
- No OpenAI ASR call when Qwen ASR succeeds.
- No durable storage of OpenAI provider responses beyond the saved transcript.

## Environment

Required when fallback is enabled:

- `AI_PROVIDER_FALLBACK_ENABLED=true`
- `OPENAI_BASE_URL=https://api.openai.com/v1`
- `OPENAI_ASR_MODEL=gpt-4o-mini-transcribe`
- `OPENAI_ASR_API_KEY`
- `OPENAI_TEXT_MODEL`
- `OPENAI_TEXT_API_KEY`
- `OPENAI_IMAGE_MODEL`
- `OPENAI_IMAGE_API_KEY`

The ASR key may be the same physical OpenAI key as the text key, but the app reads it separately so usage and rotation can be split.

## Provider Flow

1. The AI draft service calls the provider-neutral `transcribeAudio`.
2. The neutral generator calls Qwen ASR first.
3. If Qwen succeeds with non-empty text, return the Qwen transcript.
4. If Qwen fails, resolve OpenAI fallback config.
5. If fallback is disabled, rethrow the Qwen error and fail the draft through the existing service path.
6. If fallback is enabled, call `POST /audio/transcriptions` with multipart form data:
   - `file`: the recorded audio bytes.
   - `model`: `OPENAI_ASR_MODEL`.
   - `response_format`: `json`.
   - `prompt`: short household task context when provided.
7. Require a non-empty `text` field in the OpenAI response.
8. Continue with the existing structuring and image generation flow using the returned transcript.

## Failure Semantics

- Qwen ASR success: no OpenAI ASR call.
- Qwen ASR failure plus fallback disabled: original Qwen error fails the draft.
- Qwen ASR failure plus missing ASR fallback config: OpenAI config error fails the draft, making deployment issues visible.
- Qwen ASR failure plus OpenAI ASR failure: OpenAI error fails the draft.
- Later structuring or image failures continue to use the already-merged fallback behavior.

## Testing

- Config tests require ASR vars when fallback is enabled.
- OpenAI ASR client tests verify multipart request shape, model, prompt, auth key, and transcript parsing.
- Provider-neutral wrapper tests prove Qwen-first behavior, OpenAI ASR fallback on Qwen failure, and disabled fallback rethrow.
- Existing AI draft service audio tests continue to pass through dependency injection.
