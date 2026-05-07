# Handoff

## Current State

The integration branch restores generated cover images for text-input AI card drafts. Drafts now become ready only after generated text and cover bytes are saved, and the UI can show the generated cover.

## Important Files

- `src/server/ai-card-drafts/service.ts`
- `src/server/repositories/ai-card-drafts.ts`
- `src/contracts/ai-card-drafts.ts`
- `src/components/library/ai-task-manager.tsx`
- `src/server/ai/card-generation-shared.ts`
- `src/server/ai/qwen-card-generator.test.ts`
- `src/server/ai/openai-card-generator.test.ts`

## Validation Evidence

- Focused AI draft suite passed.
- Typecheck passed.
- Lint passed.
- Full Vitest suite passed.
- Live Qwen smoke checks were run for visual inspection.

## Caution

The generated prompt now targets current Library assets, but the provider can still drift. For exact 1:1 visual parity, compose the card shell deterministically and use the provider only for the central illustration.
