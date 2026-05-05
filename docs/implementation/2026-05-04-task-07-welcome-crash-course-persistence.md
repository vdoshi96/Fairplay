# Task 7: Welcome and Crash Course Persistence

## Expectations

- Add a persistent welcome surface that stays visible across protected routes until explicit close.
- Persist welcome dismissal through onboarding preferences and allow Settings to show it again.
- Link welcome actions to the crash course, library, and load map.
- Move crash-course route progress, skip, and completion from browser-only state to onboarding preference API calls.
- Add Settings actions for restarting the crash course and replaying the welcome.
- Use TDD with failing tests before implementation and targeted GREEN verification.

## Outputs

- Added `src/components/welcome/persistent-welcome.tsx`.
- Added `src/components/welcome/persistent-welcome.test.tsx`.
- Updated `src/app/app/layout.tsx`.
- Updated `src/app/app/crash-course/page.tsx`.
- Updated `src/components/settings/settings-panel.tsx`.
- Updated `src/components/settings/settings-panel.test.tsx`.
- RED run: `npm test -- src/components/crash-course/crash-course-flow.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx` failed because `PersistentWelcome` did not exist and Settings replay controls were missing.
- GREEN run: `npm test -- src/components/crash-course/crash-course-flow.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx` passed, 15 tests.
- Verification: `npm run typecheck` passed.
- Verification: `npm run lint -- src/components/welcome/persistent-welcome.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.tsx src/components/settings/settings-panel.test.tsx src/app/app/layout.tsx src/app/app/crash-course/page.tsx` completed with 0 errors; it also surfaced two existing `no-img-element` warnings in card/library files outside this task.
- Commit: created by this worker; SHA reported in final status.

## Challenges

- The crash-course page is now preference-backed through client-side `GET/PATCH /api/preferences/onboarding` calls to stay within the owned `page.tsx` file and current API surface.
- Existing lint warnings remain in `src/components/cards/card-detail-sheet.tsx` and `src/components/library/card-library.tsx`; they were not edited for this task.

## Next Handoff

- Consider adding a route-level test for the crash-course page if future ownership includes app route tests.
- The welcome replay path is wired through Settings `POST /api/preferences/welcome/replay`; route refresh should make the layout render the welcome again on protected pages.
