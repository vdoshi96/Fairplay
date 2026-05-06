# Integrated Qwen Art

## Responsibilities

- Own branch `codex/fairplay-integrated-qwen-art` in worktree `/Users/vishal/Developer/Fairplay/.worktrees/fairplay-integrated-qwen-art`.
- Update Qwen/OpenAI image prompt wording toward textless, Duolingo-style integrated app illustrations.
- Increase Qwen image generation request size to the repo-documented 5:7 value.
- Make AI draft review and accepted generated responsibility detail art larger and more naturally integrated.
- Expose and use `sourceCoverAssetPath` so accepted AI-generated covers persist into responsibility detail.
- Preserve seeded source-card cover behavior.

## Implementation Notes

- TDD was followed. The first focused run failed on prompt wording, Qwen request size, missing `sourceCoverAssetPath` contract/repository/detail mapping, and missing generated-art panel treatments.
- Shared image prompt wording now asks for a textless app illustration with a large central silhouette, generous whitespace, app-native colors, blended composition, no fake card frame, and no readable words.
- Qwen image generation now sends `1460*2044`, matching the documented 5:7 Qwen size from `docs/assets/visible-asset-generation.md`.
- `ResponsibilityDetailSchema` now exposes nullable `sourceCoverAssetPath`, and the responsibility repository maps it from Prisma.
- Responsibility detail mapping moved into `src/app/app/responsibilities/[id]/detail-card.ts` so the Next `page.tsx` keeps conventional exports.
- Accepted generated covers use `sourceCoverAssetPath` before title-matched source-card cover fallback. Seeded title-matched cards still use `/assets/fairplay/cards/...`.
- `AiCardReviewPanel` now uses a larger generated-art panel with desktop `minmax(320px,42vw)` art column and object-cover art.
- `CardDetailSheet` distinguishes generated cover art from seeded source covers. Generated art gets the larger integrated treatment; source covers keep object-contain card-cover behavior.
- Review fix: generated-art detail treatment now requires the accepted AI cover API path shape, so `/assets/fairplay/cards/...` persisted in `sourceCoverAssetPath` keeps the legacy source-card `object-contain` treatment.
- Review fix: `ResponsibilityDetailSchema` now exposes nullable persisted source fields (`sourceDefinition`, `sourceConception`, `sourcePlanning`, `sourceExecution`, `sourceMinimumStandard`), and repository/detail mapping uses those fields for accepted AI responsibilities before title-matched source-card text.
- Review fix: Qwen downloaded cover bytes now must match the declared raster MIME type, and PNG output must have detectable 5:7 dimensions before being returned.
- Review fix: source cover path contract coverage now rejects suffixed `/assets/fairplay/cards/...` and `/api/ai-card-drafts/.../cover` paths.

## Subagent / Review Fallback

- A subagent/tool search for `subagent code reviewer task delegate agent review QA` exposed GitHub/Figma/Canva tools but no Task/subagent runner.
- Because subagent tools were unavailable in this context, I performed the focused review/QA pass manually against the diff and Task 2 checklist.

## Blockers And Risks

- No active blockers.
- Playwright generated-art smoke was not added because the deterministic contract/component coverage exercises the generated-art UI without introducing auth fixture churn. Full app-level visual coverage can be added after the interaction branches merge.
- Live Qwen/OpenAI generation was not run; provider calls remain mocked by unit tests, consistent with the shared blocker that local provider credentials may be unavailable.

## Achievements

- Prompt tests protect against returning to title-bearing card-cover language.
- Qwen provider tests protect the `1460*2044` request size.
- Repository acceptance tests now prove accepted draft cover paths are returned on the created responsibility detail.
- Repository acceptance tests now prove accepted AI drafts titled like source cards return generated source fields on the created responsibility detail.
- Detail mapping tests prove generated `sourceCoverAssetPath` wins before source-card title matching, generated source fields win for AI title collisions, and source-card cover fallback still works.
- Component tests prove generated art uses larger object-cover panels in draft review and responsibility detail, while asset-backed `sourceCoverAssetPath` keeps legacy source-card rendering.
- Qwen tests now use minimal PNG fixtures and prove non-5:7, dimension-undetectable, and MIME/byte-mismatched PNG downloads fail closed.

## QA Command Outputs

### TDD Red

```text
$ npm test -- src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/contracts/responsibilities.test.ts src/server/repositories/ai-card-drafts.test.ts 'src/app/app/responsibilities/[id]/page.test.tsx' src/components/library/ai-task-manager.test.tsx src/components/cards/card-detail-sheet.test.tsx

Test Files  7 failed (7)
Tests  11 failed | 47 passed (58)
Failures included:
- ResponsibilityDetailSchema rejected unrecognized key sourceCoverAssetPath.
- OpenAI/Qwen prompt assertions still saw card-cover/title wording.
- Qwen request size still sent 500*700.
- detailCardFor was not exposed for detail mapping tests.
- generated-cover-art-panel and ai-draft-review-art-panel were missing.
```

### Review TDD Red

```text
$ npm test -- src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/contracts/responsibilities.test.ts src/server/repositories/ai-card-drafts.test.ts 'src/app/app/responsibilities/[id]/detail-card.test.ts' src/components/library/ai-task-manager.test.tsx src/components/cards/card-detail-sheet.test.tsx

Test Files  5 failed | 2 passed (7)
Tests  7 failed | 58 passed (65)
Failures included:
- Asset-backed sourceCoverAssetPath rendered with generated-cover-art-panel/object-cover.
- ResponsibilityDetailSchema rejected sourceDefinition/sourceConception/sourcePlanning/sourceExecution/sourceMinimumStandard.
- Accepted AI card titled Auto still mapped seeded source-card definition and CPE fields.
- Qwen accepted non-5:7, dimension-undetectable, and MIME/byte-mismatched PNG downloads.
- AI draft acceptance returned sourceCoverAssetPath but not generated source fields on the created responsibility.
```

### Focused Green

```text
$ npm test -- src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/contracts/responsibilities.test.ts src/server/repositories/ai-card-drafts.test.ts 'src/app/app/responsibilities/[id]/detail-card.test.ts' src/components/library/ai-task-manager.test.tsx src/components/cards/card-detail-sheet.test.tsx

> fairplay@0.1.0 test
> vitest src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/contracts/responsibilities.test.ts src/server/repositories/ai-card-drafts.test.ts src/app/app/responsibilities/[id]/detail-card.test.ts src/components/library/ai-task-manager.test.tsx src/components/cards/card-detail-sheet.test.tsx

 RUN  v3.2.4 /Users/vishal/Developer/Fairplay/.worktrees/fairplay-integrated-qwen-art

 ✓ src/app/app/responsibilities/[id]/detail-card.test.ts (3 tests) 3ms
 ✓ src/contracts/responsibilities.test.ts (10 tests) 15ms
 ✓ src/server/ai/qwen-card-generator.test.ts (19 tests) 18ms
 ✓ src/server/ai/openai-card-generator.test.ts (9 tests) 16ms
 ✓ src/components/cards/card-detail-sheet.test.tsx (3 tests) 231ms
 ✓ src/server/repositories/ai-card-drafts.test.ts (13 tests) 666ms
 ✓ src/components/library/ai-task-manager.test.tsx (8 tests) 1005ms
   ✓ AiTaskManager > fetches review detail, saves edits, and regenerates the image  354ms

 Test Files  7 passed (7)
      Tests  65 passed (65)
   Start at  09:43:32
   Duration  2.32s (transform 736ms, setup 565ms, collect 1.85s, tests 1.96s, environment 2.93s, prepare 727ms)
```

### Lint

```text
$ npm run lint

> fairplay@0.1.0 lint
> eslint .

Exit code: 0
```

### Typecheck

```text
$ npm run typecheck

> fairplay@0.1.0 typecheck
> tsc --noEmit

Exit code: 0
```

### Diff Check

```text
$ git diff --check

Exit code: 0
```
