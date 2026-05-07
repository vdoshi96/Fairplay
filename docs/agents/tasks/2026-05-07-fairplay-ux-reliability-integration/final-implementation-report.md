# Fairplay UX Reliability Integration Report

## Scope

This integration combined five isolated workstreams:

- `codex/home-loadmap-refresh`
- `codex/learner-sandbox-flows`
- `codex/ai-draft-reliability`
- `codex/crash-course-redesign`
- `codex/library-action-reliability`

The integration branch is `codex/fairplay-ux-reliability-integration`.

## Summary

- Removed the duplicate Welcome Banner learner-feature button while keeping the homepage `Learn a feature` anchor as the single clean entry point.
- Expanded homepage visual treatment so the generated background lives behind the whole learning surface instead of only a small card.
- Reworked Load Map diagnostics and filters into a denser themed workbench with grouped ownership, card detail, attention, and search controls.
- Renamed board lane copy from Player 1 and Player 2 to Alex and Max in Load Map and card detail surfaces touched by the workstream.
- Lowered guided-tour dialogs into a viewport-safe placement with internal scrolling.
- Made required dummy practice steps interactive by allowing page-level sandbox controls to receive clicks after the learner starts the practice workflow.
- Rebuilt Library, Radar, and Check-in dummy workflows as temporary sandbox workspaces with guided fields, mock artifacts, status feedback, and cleanup actions.
- Added a Check-in empty agenda modal so Preview Agenda no longer fails silently when there is nothing to preview.
- Improved real responsibility detail/edit reliability with Back to library / Back to Load Map navigation, visible Save/status/radar feedback, response checking, and unavailable-action explanation.
- Fixed AI draft generation root cause by scoping Qwen/OpenAI config to the operation being performed: text, ASR, or image.
- Updated crash-course lessons and layout around the book-report concepts: visible/hidden work, owner versus helper, CPE, standards, dynamic fairness, check-ins, deferral, repair, and safety.
- Fixed dark-mode contrast regressions introduced by new translucent Load Map surfaces.

## Root-Cause Findings

### AI Card Draft Generation

Failure source: provider configuration was all-or-nothing. Text structuring could fail before a provider call if unrelated ASR or image environment variables were missing.

Architectural cause: shared config readers forced every operation to require text, ASR, and image settings at once.

Implemented fix: `src/server/ai/qwen-config.ts` and `src/server/ai/openai-config.ts` now expose operation-scoped config readers. `src/server/ai/card-generator.ts` requests only the fallback config needed by the failed stage.

Validation: focused AI tests and full unit suite passed. No live Qwen/OpenAI calls were made during QA.

### Learner Workflow Trapping

Failure source: the centered guide dialog and backdrop could intercept pointer events for page-level dummy controls after the dummy workflow started.

Implemented fix: the guide remains modal before practice starts, then makes the backdrop click-through only while required page-level practice is active and incomplete. Dialog placement is lower and scroll-safe.

Validation: guided-learning Playwright flow now completes the dummy Library workflow and exits the guide.

### Load Map Dark Contrast

Failure source: new light Tailwind alpha classes and diagnostic tone classes were not covered by the dark theme overrides.

Implemented fix: added dark-theme overrides for the new `bg-white/*` alpha values and diagnostic tile color classes.

Validation: dark-mode Playwright contrast and screenshot QA passed.

## Documentation

Branch-level notes were added under:

- `docs/agents/tasks/2026-05-07-ai-draft-reliability/`
- `docs/agents/tasks/2026-05-07-crash-course-redesign/`
- `docs/agents/tasks/2026-05-07-home-loadmap-refresh/`
- `docs/agents/tasks/2026-05-07-learner-sandbox-flows/`
- `docs/agents/tasks/2026-05-07-library-action-reliability/`

This file is the final integration summary.

## Visual QA

Playwright generated dark-mode screenshots at:

- `test-results/dark-mode-polish/home.png`
- `test-results/dark-mode-polish/library.png`
- `test-results/dark-mode-polish/load-map.png`
- `test-results/dark-mode-polish/radar.png`
- `test-results/dark-mode-polish/check-ins.png`
- `test-results/dark-mode-polish/crash-course.png`
- `test-results/dark-mode-polish/settings.png`

The e2e suite also ran responsive visual smoke checks and Little Alex pixel/sprite QA.

## Verification

Latest integrated verification:

- `npm test -- --run`: passed, 95 files / 529 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run test:e2e`: passed, 26 Playwright tests.
- `git diff --check main..HEAD` and `git diff --check`: passed after final report updates.

## Code Review

Independent review flagged two issues:

- The guide backdrop briefly made the whole page clickable during required practice. Fixed by cutting a measured pointer aperture only around `[data-guide-practice-surface]`, leaving the rest of the backdrop blocking.
- Card detail move labels still said Player 1 / Player 2. Fixed to Alex / Max.

Both fixes were covered by focused unit tests and the final full verification sweep.

## Rollback Instructions

The integration branch keeps each workstream as a merge commit. To rollback a specific workstream before merging to main, revert the matching merge commit on `codex/fairplay-ux-reliability-integration`.

High-scope rollback targets:

- AI config behavior: revert `Merge AI draft reliability workstream`.
- Crash course content/layout: revert `Merge crash course redesign workstream`.
- Homepage and Load Map layout: revert `Merge home and load map refresh workstream`.
- Learner sandbox workflows: revert `Merge learner sandbox flow workstream`.
- Detail/editor action reliability: revert `Merge library action reliability workstream`.

After merge to `main`, use normal revert commits rather than rewriting history.

## Unresolved Issues

- No live provider generation was performed in QA. Provider availability, billing, and rate limits remain external runtime risks.
- Existing generated visual assets were reused; no new Qwen image assets were committed in this integration because the repository already contained thematic assets for the touched surfaces.
- Seeded source-card titles still contain original Fair Play card names such as `Adult Friendships (Player 1)` and `Adult Friendships (Player 2)`. Those were left intact as source-card content rather than app lane labels.

## Future Recommendations

- Add a small reusable dark-mode utility for translucent card surfaces so future alpha classes do not need one-off global overrides.
- Consider wiring CardDetailSheet footer actions on the detail page instead of only explaining their unavailable state.
- Add a dedicated Learner Feature sidebar tab if future navigation needs outgrow the homepage anchor.
- Run occasional live AI draft smoke tests in a staging environment with known-safe provider credentials.
