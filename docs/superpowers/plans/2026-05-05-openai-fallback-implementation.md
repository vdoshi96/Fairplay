# OpenAI Fallback Implementation Plan

> REQUIRED SUB-SKILLS: Use superpowers:test-driven-development and superpowers:subagent-driven-development. Keep changes scoped to the AI provider layer and docs unless tests show a service import needs adjustment.

**Goal:** Add OpenAI text and image fallback for AI Task Manager while keeping Qwen primary and preserving the current audio flow.

**Architecture:** Introduce a provider-neutral `card-generator` module that the AI draft service imports. It delegates to Qwen first and calls OpenAI only after Qwen throws and fallback is enabled. Add an OpenAI fallback config module plus OpenAI text/image client functions.

---

## Task 1: Red Tests And Provider Contract

**Files:**

- Create `src/server/ai/openai-config.test.ts`
- Create `src/server/ai/openai-card-generator.test.ts`
- Create `src/server/ai/card-generator.test.ts`

- [ ] Write failing config tests for enabled/disabled fallback env resolution.
- [ ] Write failing OpenAI client tests for Responses API structured card output and image base64 output.
- [ ] Write failing provider-neutral wrapper tests for Qwen-first, fallback-on-Qwen-failure, disabled fallback, and ASR fallback behavior.
- [ ] Run focused AI tests and confirm they fail because the fallback modules do not exist yet.

## Task 2: Shared Card Generation Utilities

**Files:**

- Create `src/server/ai/card-generation-shared.ts`
- Modify `src/server/ai/qwen-card-generator.ts`

- [ ] Move shared generated card types, Zod schema, prompts, image prompt builders, safe raster MIME handling, and prompt caps into the shared module.
- [ ] Keep Qwen behavior unchanged by importing the shared helpers.
- [ ] Run existing Qwen generator tests and confirm they remain green.

## Task 3: OpenAI Fallback Provider

**Files:**

- Create `src/server/ai/openai-config.ts`
- Create `src/server/ai/openai-card-generator.ts`
- Modify `.env.example`

- [ ] Implement fallback config with `AI_PROVIDER_FALLBACK_ENABLED` gating required OpenAI values.
- [ ] Implement OpenAI card structuring through `/responses` with strict JSON schema output.
- [ ] Implement OpenAI image generation through `/images/generations` with `1024x1536`, low quality, PNG output, and base64 decoding.
- [ ] Support URL output defensively with the same safe download validation.
- [ ] Add OpenAI env placeholders to `.env.example`.

## Task 4: Provider-Neutral Wrapper

**Files:**

- Create `src/server/ai/card-generator.ts`
- Modify `src/server/ai-card-drafts/service.ts`
- Modify `src/server/ai-card-drafts/service.test.ts` only if type imports require it

- [ ] Export `transcribeAudio`, `structureTaskAsCard`, and `generateCardCover` from the wrapper.
- [ ] For audio transcription, call Qwen first and OpenAI only after a thrown error when fallback is enabled.
- [ ] For structuring and image generation, call Qwen first and OpenAI only after a thrown error when fallback is enabled.
- [ ] Change the AI draft service default deps to import the wrapper.

## Task 5: Verification, Review, And Merge

- [ ] Run focused AI tests.
- [ ] Run full `npm test -- --run`.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run prisma:validate`, and `npm run build`.
- [ ] Request subagent review for spec compliance and code quality.
- [ ] Push `codex/openai-fallback`, open a PR, wait for checks, merge to `main`, delete the branch, and fast-forward local `main`.
