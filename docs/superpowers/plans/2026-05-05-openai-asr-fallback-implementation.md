# OpenAI ASR Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OpenAI speech-to-text fallback for AI Task Manager voice captures while keeping Qwen ASR primary.

**Architecture:** Extend the existing OpenAI fallback config with ASR model/key fields. Add an OpenAI transcription client in the existing OpenAI provider module, then update the provider-neutral wrapper to call Qwen ASR first and OpenAI ASR only after Qwen fails and fallback is enabled.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, OpenAI Audio Transcriptions API, Qwen OpenAI-compatible ASR.

---

## File Structure

- Modify `src/server/ai/openai-config.ts`: add `asrApiKey` and `asrModel` to enabled fallback config.
- Modify `src/server/ai/openai-config.test.ts`: assert ASR env resolution and missing-var behavior.
- Modify `src/server/ai/openai-card-generator.ts`: add `transcribeAudioWithOpenAi`.
- Modify `src/server/ai/openai-card-generator.test.ts`: add OpenAI ASR multipart tests.
- Modify `src/server/ai/card-generator.ts`: wrap Qwen ASR with OpenAI fallback.
- Modify `src/server/ai/card-generator.test.ts`: add provider-neutral ASR fallback tests.
- Modify `.env.example`: add OpenAI ASR fallback vars.
- Modify `docs/implementation/2026-05-05-ai-task-manager.md`: document ASR fallback.
- Modify `docs/superpowers/specs/2026-05-05-openai-fallback-design.md`: update the previous no-ASR-fallback notes.

## Task 1: Red Tests

- [ ] Add config test expectations for `OPENAI_ASR_MODEL` and `OPENAI_ASR_API_KEY`.
- [ ] Add OpenAI ASR client tests that expect `POST /audio/transcriptions` multipart form data and a parsed transcript.
- [ ] Add wrapper tests for Qwen ASR success, Qwen ASR failure with fallback enabled, and Qwen ASR failure with fallback disabled.
- [ ] Run focused AI tests and confirm they fail because ASR config/client/wrapper support is missing.

## Task 2: Minimal Implementation

- [ ] Extend OpenAI config and env docs with ASR key/model.
- [ ] Implement OpenAI transcription client using multipart `FormData`.
- [ ] Update provider-neutral `transcribeAudio` to Qwen-first/OpenAI-fallback.
- [ ] Keep service stages and audio retention unchanged.

## Task 3: Verification And Merge

- [ ] Run focused AI tests.
- [ ] Run full tests, typecheck, lint, Prisma validate, and production build.
- [ ] Commit and push `codex/openai-asr-fallback`.
- [ ] Open PR, wait for checks, merge into `main`, delete remote branch, fast-forward local `main`.
