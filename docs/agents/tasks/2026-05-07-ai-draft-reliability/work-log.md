# Work Log

## 2026-05-07

- Loaded systematic debugging and TDD workflows.
- Verified the assigned worktree was clean before edits.
- Read the Qwen/OpenAI config and generator modules, provider-neutral fallback, AI draft service, and route failure helper.
- Added RED regression tests showing operation-specific env should be enough for Qwen and OpenAI text, ASR, and image stages.
- Verified the tests failed with `QWEN_CONFIG_MISSING` and `OPENAI_FALLBACK_CONFIG_MISSING` before mocked provider calls.
- Implemented operation-scoped Qwen config readers and wired Qwen generators to text/ASR/image readers.
- Implemented operation-scoped OpenAI fallback readers and wired provider-neutral fallback to use the reader for the failed stage.
- Updated README, `.env.example`, and local development docs to describe the per-operation env contract.
- Added this task documentation set under `docs/agents/tasks/2026-05-07-ai-draft-reliability/`.
