# Crash Course Concept Polish And Final QA

Date: 2026-05-08
Branch: `codex/crash-course-concepts-final-qa`

## What Changed

- Rewrote the 14-frame Crash Course into shorter concept-first lessons.
- Kept app navigation out of the book-concept frames; the Library, Load Map, and Check-ins recommendations now appear only in the final learning path.
- Replaced the floating course-title treatment with an integrated page header and a stronger shared background wash.
- Reworked lesson text into compact `Idea` and `Try` panels for faster scanning.
- Shortened the completion splash and updated the final Check-ins recommendation to match the lightweight scheduling/record flow.
- Renamed the Library page header from `Source deck` to `Library` during final copy QA.
- Updated visual QA specs to match the merged Home, Library, Load Map, Check-ins, Settings, and Crash Course headings.

## Why

The Crash Course was visually disconnected from the rest of the app and mixed conceptual learning with app instructions too often. This pass keeps the generated story assets, but makes the course read like a concise primer first and a workflow recommendation second.

## Design Decisions

- Used cleared paraphrased research docs under `docs/research/`; no private `References/` files were opened.
- Preserved all 14 generated storyboard scenes so existing visual assets remain useful.
- Kept source-specific terminology limited and source-safe; user-facing copy avoids exact branded ritual names and long book-report phrasing.
- Kept the safety note brief and non-prescriptive: unsafe or coercive topics should not be handled by a household workflow as the fix.
- Left the final recommended path intentionally short: choose one card, assign/review it, then schedule and record a check-in.

## QA

- `npm test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-page-client.test.tsx --run`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run prisma:validate`
- `npm run build`
- `npx playwright test e2e/corrective-responsive-visual.spec.ts --project=chromium`
- `npx playwright test e2e/dark-mode-visual.spec.ts e2e/guided-learning.spec.ts --project=chromium`
- `npx playwright test e2e/guided-learning.spec.ts --project=chromium`

Results:

- Focused Crash Course tests: 2 files, 12 tests passed.
- Full Vitest: 86 files, 498 tests passed.
- Responsive visual QA: 2 Playwright tests passed after increasing the Crash Course desktop right reserve so Little Alex no longer overlaps lesson tabs.
- Dark-mode visual QA: passed after updating the stale Load Map assertion to the current `Owners` signal.
- Guided learning QA: passed after updating stale Library practice expectations to the current practice workflow labels.

## Remaining Risks

- Final PR merge verification is still pending.
- Crash Course images were preserved rather than regenerated; future asset work should only use approved source-safe prompts and generated art.
