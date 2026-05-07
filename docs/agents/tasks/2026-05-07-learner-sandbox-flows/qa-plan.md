# QA Plan

Focused automated checks:

- `npm test -- src/components/guide/guided-tour.test.tsx src/components/guide/guide-content.test.ts`
- `npm test -- src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx`
- `npm test -- src/components/radar/radar-board.test.tsx`
- `npm test -- src/components/check-ins/check-in-flow.test.tsx`
- `git diff --check`

Manual/browser spot checks if time allows:

- Open each guide from Load Map, Library, Radar, and Check-ins at desktop and narrow widths.
- Confirm guide dialog does not clip at top or right and scrolls internally on short viewports.
- Confirm Skip and Escape still close the guide.
- Confirm dummy workflows show mock artifacts, do not call production mutation handlers, persist during onboarding, and can be cleaned up.
- Confirm Check-in `Preview agenda` with no items opens the empty agenda modal and close dismisses it.
