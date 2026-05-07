# AI Card Generation Recovery QA Results

Date: 2026-05-07

## Automated Tests

Passed:

```bash
npm test -- --run
npm test -- src/components/library/ai-task-manager.test.tsx --run
npm test -- src/components/library/ai-task-manager.test.tsx src/server/ai-card-drafts/service.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' --run
npm test -- src/server/repositories/ai-card-drafts.test.ts --run
npm test -- src/contracts/ai-card-drafts.test.ts src/server/ai/card-generation-shared.test.ts src/server/ai-card-drafts/service.test.ts src/app/api/ai-card-drafts/route.test.ts 'src/app/api/ai-card-drafts/[id]/route.test.ts' src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx src/server/ai/card-generator.test.ts src/server/ai/qwen-card-generator.test.ts src/server/ai/openai-card-generator.test.ts src/server/repositories/ai-card-drafts.test.ts --run
npm run typecheck
npm run lint
git diff --check
```

Full Vitest result: 96 test files, 538 tests passed.

Coverage added:

- Failed drafts show `Retry` and `Remove`, not `Cancel`.
- Canceled drafts show `Remove`.
- `DELETE /api/ai-card-drafts/:id` reaches `aiCardDraftService.discard`.
- The service discards only failed/canceled drafts and rejects processing/ready/accepted drafts.
- The repository deletes only failed/canceled drafts in the current household.
- Retry recovers failed drafts that already have complete generated text fields without re-saving generation.
- Retry success updates the open failed detail panel to ready/editable content immediately.

## Visual QA

Dev server:

```bash
npm run dev -- --port 3102
```

Screenshots:

- `/Users/vishal/Developer/Fairplay/test-results/ai-card-recovery/desktop-failed-canceled.png`
- `/Users/vishal/Developer/Fairplay/test-results/ai-card-recovery/mobile-failed-canceled.png`
- `/Users/vishal/Developer/Fairplay/test-results/ai-card-recovery/desktop-failed-review.png`
- `/Users/vishal/Developer/Fairplay/test-results/ai-card-recovery/desktop-after-removal.png`

Validated:

- Desktop tracker displays failed and canceled drafts without overlapping action buttons.
- Failed draft card shows `Retry` and `Remove`.
- Canceled draft card shows `Remove`.
- Failed draft detail panel shows `Retry` and `Remove`.
- Removing failed and canceled drafts clears the tracker to the empty state.
- Mobile tracker remains single-column and action buttons remain reachable.
- The failed/canceled state shown in the user screenshot is no longer trapped.

## Image Analysis Findings

- `desktop-failed-canceled.png`: action buttons are visible and semantically correct.
- `mobile-failed-canceled.png`: responsive layout stacks cards cleanly; no incoherent overlap in the tracker area.
- `desktop-after-removal.png`: tracker renders `No AI-created cards yet.` after both failed/canceled drafts are removed.
- `desktop-failed-review.png`: recovery controls are correct, but the screenshot shows a dark vertical block on the right side of the wider Library layout. This appears separate from AI draft recovery and should be tracked as a visual polish issue if it persists.

## Not Run

- Live Qwen text provider smoke.
- Live OpenAI fallback smoke.
- GitHub PR merge verification.

Those remain environment/release workflow checks, not local code-path blockers for this fix.
