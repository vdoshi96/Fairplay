# QA Findings

## Automated

- Focused Vitest suite passed after implementation: 15 files, 129 tests.
- Coverage included AI draft discard UI/service/repository, Radar removal assertions, crash-course restart, guide content/helper, Check-ins empty agenda copy, and visuals.
- Full Vitest suite passed: 95 files, 524 tests.
- Lint, typecheck, and production build passed.
- Full Playwright e2e suite passed with one serial worker: 27 tests.

## Visual/Image Review

- Existing user screenshots showed the desired ready card state and the product surfaces where Radar felt too formal.
- No new generated assets were introduced.
- Responsive visual QA found that removing the Radar home card shortened the Home page enough for the full-body Little Alex artwork to paint below the shell at desktop widths.
- The full-body anchor clamp now reserves bottom padding, and the corrective responsive visual e2e spec passed afterward.

## Reproduction Steps

1. Generate an AI card draft in Library.
2. Confirm a ready draft shows `Review`, `Put in play`, and `Discard`.
3. Click `Discard` and confirm the draft leaves the tracker.
4. Open Home, Load Map, onboarding, and crash course; confirm Radar is absent from navigation, cards, filters, and copy.
5. Complete or mock completed crash-course preferences; click `Restart crash course`; confirm lesson one is shown.
