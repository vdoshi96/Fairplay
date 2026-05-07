# Debugging Log

## 2026-05-07

- Confirmed worktree path and branch: `/Users/vishal/Developer/Fairplay/.worktrees/ai-draft-reliability` on `codex/ai-draft-reliability`.
- Inspected `src/server/ai/qwen-config.ts`, `src/server/ai/qwen-card-generator.ts`, `src/server/ai/openai-config.ts`, `src/server/ai/openai-card-generator.ts`, and `src/server/ai/card-generator.ts`.
- Found Qwen card structuring, Qwen ASR, and Qwen image generation all called one full `getQwenConfig()` reader. That reader required `QWEN_CARD_*`, `QWEN_ASR_MODEL`, `QWEN_OPENAI_BASE_URL`, and `QWEN_IMAGE_*` for every operation.
- Found OpenAI direct fallback generation used one full fallback config reader, so text fallback required ASR and image env, ASR fallback required text and image env, and image fallback required text and ASR env.
- Reproduced with failing regression tests that provided only the env required by each operation. Failures happened before mocked `fetch` calls, proving the failure source was local config validation rather than a provider outage.
- Confirmed service/API safe failure mapping already returns `GENERATION_FAILED` with request/draft IDs and without raw provider details.

## Root Cause

AI provider configuration was modeled as one all-or-nothing bundle even though generation is a three-step pipeline with different dependencies:

- Text/card structuring needs text model, text API key, and compatible base URL.
- Audio transcription needs ASR model, ASR-capable API key, and compatible base URL.
- Image generation needs image model, image API key, and image base URL.

Because of that coupling, missing audio or image env could break a text-only draft before the app made any Qwen/OpenAI request.
