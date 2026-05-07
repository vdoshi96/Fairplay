# AI Card Provider Schema Fix Final Summary

Date: 2026-05-07
Branch: `codex/ai-card-generation-provider-fix`

## Summary

AI card generation was failing after a successful Qwen HTTP response because Qwen returned human-readable `hiddenEffortKeys` and `cadence` values. The local schema requires strict enum tokens. The fix makes the provider prompt explicit about those allowed tokens.

## Changed Files

- `src/server/ai/card-generation-shared.ts`
- `src/server/ai/qwen-card-generator.test.ts`
- `docs/agents/tasks/2026-05-07-ai-card-provider-schema-fix/debugging-log.md`
- `docs/agents/tasks/2026-05-07-ai-card-provider-schema-fix/final-summary.md`

## Tests

Added a regression test proving the outgoing Qwen prompt includes every allowed `hiddenEffortKeys` and `cadence` token and tells the provider to use enum tokens only.

Passed focused suite:

```bash
npm test -- src/server/ai/qwen-card-generator.test.ts src/server/ai/card-generation-shared.test.ts src/server/ai/card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts --run
```

Result: 6 files, 79 tests passed.

Final verification:

```bash
npm test -- --run
npm run typecheck
npm run lint
git diff --check
```

Result: full Vitest passed with 96 files and 539 tests.

## Rollback

Revert the prompt additions in `card-generation-shared.ts` and remove the regression test. Rolling back will likely restore provider-success/schema-failure behavior for everyday prompts.

## Future Recommendations

- Consider an async generation worker if 40-60 second provider latency remains common.
- Consider a controlled normalizer only for safe, obvious cadence aliases if provider drift continues.
- Keep app diagnostics safe: request IDs and provider metadata only, never prompts or raw provider bodies.
