# Architecture Decision

## Decision

Use operation-scoped provider configuration for AI card draft generation.

## Implemented Shape

- Qwen now exposes text, ASR, and image config readers.
- Qwen card structuring resolves only text config.
- Qwen transcription resolves only ASR config.
- Qwen cover generation resolves only image config and still validates the approved image model before network calls.
- OpenAI fallback now exposes text, ASR, and image fallback config readers behind `AI_PROVIDER_FALLBACK_ENABLED`.
- Provider-neutral fallback selects the fallback config reader that matches the failed stage.

## Rationale

The AI draft pipeline stages are independent provider operations. Requiring all env for every stage made local and Vercel env hydration brittle: a missing `QWEN_ASR_MODEL` or `OPENAI_ASR_*` could break text card generation even when no audio transcription was requested.

## Safe Diagnostics Contract

The fix does not add prompt, audio, API key, or raw provider body logging. Existing diagnostics continue to serialize safe metadata only: event, request ID, route, stage, provider, model, status, provider request ID, and error code/name.
