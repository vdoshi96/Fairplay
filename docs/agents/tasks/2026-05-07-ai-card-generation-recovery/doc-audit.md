# AI Card Generation Recovery Documentation Audit

Date: 2026-05-07
Branch: `codex/ai-card-recovery-doc-audit`
Worktree: `/Users/vishal/Developer/Fairplay/.worktrees/ai-card-recovery-doc-audit`

## Branch Summary

This branch is documentation-only. It audits the repository history around AI-created Library cards, especially the May 5 AI Task Manager design/implementation, OpenAI fallback plans, diagnostics, and the May 7 text-only and reliability recovery branches.

I reviewed the Markdown corpus by inventorying all `*.md` files, extracting headings and AI/failure/rollback keywords globally, and reading the AI-card-relevant documents in full. The repository currently has 553 Markdown files, about 22,925 total lines. The highest-signal documents for this recovery are:

- `README.md`
- `docs/implementation/2026-05-05-ai-task-manager.md`
- `docs/implementation/2026-05-05-ai-draft-diagnostics.md`
- `docs/superpowers/specs/2026-05-05-ai-task-manager-design.md`
- `docs/superpowers/plans/2026-05-05-ai-task-manager-implementation.md`
- `docs/superpowers/specs/2026-05-05-openai-fallback-design.md`
- `docs/superpowers/plans/2026-05-05-openai-fallback-implementation.md`
- `docs/superpowers/specs/2026-05-05-openai-asr-fallback-design.md`
- `docs/superpowers/plans/2026-05-05-openai-asr-fallback-implementation.md`
- `docs/agents/tasks/2026-05-07-text-only-card-generation/*`
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/*`
- `docs/agents/tasks/2026-05-07-fairplay-ux-reliability-integration/final-implementation-report.md`
- `docs/agents/tasks/2026-05-07-library-action-reliability/*`

Current documented product state: AI Task Manager card generation is text-only, Library-first, Qwen-primary, and optionally OpenAI text-fallback-backed. It does not require ASR, OCR, audio upload, image generation, or cover bytes for the active Library flow.

## Prior Attempts And Timeline

1. Original May 5 AI Task Manager design planned a broad multimodal pipeline: text or recorded audio input, Qwen ASR, Qwen card structuring, Qwen image generation, cover persistence, audio retention/deletion, retry, regenerate image, and put-in-play.
2. The May 5 implementation note documents a narrower shipped shape: text-only card creation through `/app/library`; multipart audio rejected; regenerate image deprecated; cover route retained only for legacy drafts; no ASR/OCR/ACR/audio/image generation in the Library generation path.
3. OpenAI fallback design added a Qwen-first provider-neutral wrapper for ASR, text, and image steps. The later text-only state leaves only text fallback relevant to the active Library card-generation path.
4. AI draft diagnostics added safe `[fairplay-ai-diagnostics]` logs and a `GENERATION_FAILED` API shape with `requestId` and `draftId`, without logging prompts, task text, raw provider bodies, audio, generated URLs, or secrets.
5. The May 7 text-only recovery branch formalized the product decision: create/retry no longer call cover generation or audio transcription, accepting a generated draft does not require cover bytes, image prompt/transcript fields are no longer exposed in active contracts, and each prompt is tracked independently.
6. The May 7 AI draft reliability branch fixed the backend root cause for text generation failures: provider config readers had been all-or-nothing, so missing ASR/image env could break text-only generation before any provider request.
7. The UX reliability integration branch merged the AI reliability workstream and recorded no live provider QA; all provider validation was through mocked/focused tests.

## Failed Approaches

- All-in-one provider configuration was brittle. `getQwenConfig()` and the OpenAI fallback config required text, ASR, and image env for every operation. This meant a text-only card draft could fail locally or in Vercel when unrelated audio/image variables were absent.
- The original multimodal plan overcoupled the user-visible Library flow to media stages. Image/ASR failures could block or confuse a card result that the current product only needs as structured text.
- Regenerate image was left behind by the active product direction. It is now intentionally deprecated with `410 Gone`; future branches should not re-enable it without a fresh product decision.
- Requiring cover bytes before `Put in play` conflicted with text-only generated cards. The text-only branch removed that requirement.
- Live-provider verification has repeatedly been deferred. Existing docs validate mocks and failure mapping, but not Qwen/OpenAI credentials, billing, rate limits, or provider response drift.

## Architectural Assumptions

- `AiCardDraft` persistence may still contain legacy audio/cover/image columns for compatibility, but new Library generation should not write audio bytes, cover bytes, image prompts, or transcripts.
- Public generation stages for active drafts are text-oriented: `queued`, `structuring`, `ready`, and `failed`; legacy media stages are mapped to text-compatible summaries.
- AI draft operations are household- and selected-persona-scoped.
- The provider-neutral generator should resolve only the config for the operation being performed: text, ASR, or image. In the active Library path, only text config should be required.
- Qwen remains primary for card structuring. OpenAI fallback is enabled only when `AI_PROVIDER_FALLBACK_ENABLED=true`.
- Active OpenAI fallback for Library card generation requires only `OPENAI_BASE_URL`, `OPENAI_TEXT_MODEL`, and `OPENAI_TEXT_API_KEY`.
- Safe diagnostics must remain metadata-only. Do not log prompt text, generated card content, raw responses, provider URLs, audio, API keys, household data, or private draft text.
- Generation currently runs synchronously inside create/retry request handling. A future queue may be introduced without changing the tracker contract, but that is not current behavior.

## Temporary Workarounds And Compatibility Notes

- Legacy DB fields and routes remain for older persisted drafts: cover/audio columns and `GET /api/ai-card-drafts/:id/cover`.
- `POST /api/ai-card-drafts/:id/regenerate-image` is compatibility-only and should return `410 Gone`.
- Older media-related generation stages are mapped before they reach active contract summaries.
- The review form still uses simple comma-separated inputs for area and hidden-effort keys.
- `Track for later` is visible/unavailable in generated draft contexts until a persistent saved-draft list exists. A separate Library action reliability branch did not add a production `Track for later` label.
- Accepted AI drafts remain visible in the Library tracker as accepted drafts.
- Some broader app verification remains DB-limited in documentation because local Docker/Postgres has often been unavailable.

## Rollback Notes

- The integration report says the AI reliability workstream can be rolled back before merge by reverting `Merge AI draft reliability workstream` on `codex/fairplay-ux-reliability-integration`.
- For the text-only branch, a targeted rollback would need to restore audio/image generation calls, cover-required acceptance, media stages, image review UI, and regenerate-image behavior. That should be treated as a product reversal, not a routine bug rollback.
- For provider-config reliability, a narrow rollback would revert operation-scoped Qwen/OpenAI config readers and wrapper wiring. That would reintroduce the documented failure where missing ASR/image env breaks text-only generation.
- For diagnostics, rollback must preserve the safe logging boundary. Removing request IDs would make Vercel investigation harder; adding raw provider details would violate the documented privacy contract.

## Reproduction Clues

- To reproduce the reliability bug documented on May 7, run provider generator tests with only the env required for the operation under test. Before the fix, text-only cases failed with `QWEN_CONFIG_MISSING` or `OPENAI_FALLBACK_CONFIG_MISSING` before mocked `fetch` calls.
- User-visible API failures should return safe JSON shaped like:

```json
{
  "error": "AI card draft generation failed.",
  "code": "GENERATION_FAILED",
  "requestId": "fp_ai_...",
  "draftId": "550e8400-e29b-41d4-a716-446655440011"
}
```

- In Vercel logs, search for `[fairplay-ai-diagnostics]`, then filter by the displayed `requestId`.
- A manual smoke path from the implementation docs: configure DB/session/Qwen text env, run migrations/dev server, log in, select persona, open `/app/library`, create an AI Task Manager text draft, confirm the prompt clears immediately, review/edit/save fields, retry/cancel a forced failure, and put a ready draft in play.
- No existing doc claims live provider smoke passed. Treat provider availability, billing, rate limits, response shape, and deployment env hydration as unresolved runtime checks.

## Relevant Docs Index

### Current Runtime And Env

- `README.md`: current top-level statement that Library card generation is text-only and needs only Qwen text env plus optional OpenAI text fallback env.
- `docs/deployment/local-development.md`: repeats text-only AI env requirements and DB-backed verification limitations.
- `docs/deployment/vercel.md`: deployment env/migration guidance; no AI-specific live-provider proof.
- `docs/deployment/release-checklist.md`: broader production readiness remains blocked by DB-backed checks in previous workspace runs.

### AI Card Generation Core

- `docs/superpowers/specs/2026-05-05-ai-task-manager-design.md`: original broad multimodal AI Task Manager design.
- `docs/superpowers/plans/2026-05-05-ai-task-manager-implementation.md`: TDD implementation plan for schema, Qwen client, repository/service, routes, Library UI, and docs.
- `docs/implementation/2026-05-05-ai-task-manager.md`: current implementation note and manual smoke test; documents the text-only pivot.
- `docs/implementation/2026-05-05-ai-draft-diagnostics.md`: safe diagnostics and failure response contract.

### Provider Fallback History

- `docs/superpowers/specs/2026-05-05-openai-fallback-design.md`: Qwen-first fallback design for ASR/text/image.
- `docs/superpowers/plans/2026-05-05-openai-fallback-implementation.md`: provider-neutral wrapper and OpenAI text/image fallback plan.
- `docs/superpowers/specs/2026-05-05-openai-asr-fallback-design.md`: ASR fallback design, now mostly legacy relative to text-only Library generation.
- `docs/superpowers/plans/2026-05-05-openai-asr-fallback-implementation.md`: implementation plan for OpenAI ASR fallback.

### May 7 Recovery Branches

- `docs/agents/tasks/2026-05-07-text-only-card-generation/architecture-decision.md`: authoritative text-only decision and UI contract.
- `docs/agents/tasks/2026-05-07-text-only-card-generation/work-log.md`: implementation trail for removing audio/image generation from create/retry flows.
- `docs/agents/tasks/2026-05-07-text-only-card-generation/final-qa.md`: focused verification results and not-run live-provider/browser notes.
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/debugging-log.md`: root-cause analysis for all-or-nothing provider config.
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/architecture-decision.md`: operation-scoped provider config decision.
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/final-qa.md`: focused backend verification and not-run live-provider/browser notes.
- `docs/agents/tasks/2026-05-07-ai-draft-reliability/blockers.md`: remaining watch items for env hydration and live provider failures.
- `docs/agents/tasks/2026-05-07-fairplay-ux-reliability-integration/final-implementation-report.md`: integration-level root cause, validation, rollback, unresolved issues, and future recommendations.
- `docs/agents/tasks/2026-05-07-library-action-reliability/*`: detail/editor action feedback after putting Library cards in play.

### Product And Safety Context

- `docs/product/ip-safety-review.md`: relationship-safety, privacy, and IP boundaries for generated copy/prompts.
- `docs/product/visual-system.md`: original visual direction and reminder that character art is optional, while app function must work without images.
- `docs/product/data-model.md`, `docs/product/user-flows.md`, `docs/product/v1-scope.md`: household responsibility, private draft, ownership, radar, check-in, and v1 scope context.
- `docs/research/fair-play-book-report.md` and `docs/research/a-better-share-book-report.md`: conceptual research only; do not copy source deck wording, worksheets, prompts, or visual systems.

### Adjacent Generated Asset History

- `docs/assets/visible-asset-generation.md`, `docs/superpowers/outcomes/2026-05-05-generated-ui-assets.md`, and `docs/superpowers/outcomes/2026-05-06-professional-qwen-visual-refresh.md`: Qwen image-generation learnings, including rate limits, retry/backoff, env hydration issues, and aspect-ratio constraints. These are relevant as cautionary evidence, not active dependencies for text-only card generation.
- `docs/helper-system/*` and Little Alex task docs: document Qwen asset-generation behavior and rollback/QA patterns; not directly part of AI card generation.

## Recommendations

1. Preserve text-only Library card generation unless a new spec explicitly reopens audio/image scope.
2. Keep operation-scoped provider config as a regression boundary. Text-only generation must not require ASR or image env.
3. Add a staging live-provider smoke checklist for Qwen text and optional OpenAI text fallback using safe, non-sensitive prompts. Record provider request IDs only when safe headers are available.
4. Add or preserve regression tests that prove missing `QWEN_ASR_MODEL`, `QWEN_IMAGE_*`, `OPENAI_ASR_*`, and `OPENAI_IMAGE_*` do not break text-only generation.
5. Keep `GENERATION_FAILED` responses and `[fairplay-ai-diagnostics]` request IDs visible enough for support without leaking prompts or provider payloads.
6. Do not revive `regenerate-image`, audio upload, ASR fallback, cover-byte requirements, or image prompts from the older design by accident during merges.
7. When resolving conflicts, prefer `README.md`, `docs/implementation/2026-05-05-ai-task-manager.md`, and the May 7 text-only/reliability docs over the original May 5 multimodal design for current behavior.
8. Before production readiness, rerun DB-backed repository/e2e checks in a Postgres-capable environment and run at least one live AI card generation smoke in staging.

## Blockers

- No blocker for this documentation audit.
- Runtime validation gaps remain outside this branch: no live Qwen/OpenAI provider calls were performed in the audited recovery branches, and broader DB-backed verification has been unavailable in several documented workspace runs.
