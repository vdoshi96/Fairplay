# Task 4: Premium UI Foundation and App Chrome

## Expectations

- Add failing tests first for shared UI primitives and app-shell route chrome.
- Create Button, Chip, IconButton, SegmentedControl, Sheet, and Surface primitives.
- Add balanced global design tokens and reduced-motion handling.
- Redesign the app shell with premium route chrome, active route state, Library and Crash course entries, lucide icons, desktop navigation, and a mobile tab bar.
- Stay inside Worker 2 ownership and avoid package files.

## Outputs

- Changed `src/app/globals.css` with premium tokens, color aliases, shadows, surfaces, and global reduced-motion safeguards.
- Created `src/components/ui/button.tsx`, `src/components/ui/chip.tsx`, `src/components/ui/icon-button.tsx`, `src/components/ui/segmented-control.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/surface.tsx`, and `src/components/ui/ui-primitives.test.tsx`.
- Updated `src/components/app-shell/app-shell.tsx` with route-aware desktop sidebar and mobile bottom navigation using `lucide-react`.
- Updated `src/components/app-shell/app-shell.test.tsx` for active route chrome, Library, and Crash course.
- Tests run:
  - `npm test -- src/components/ui/ui-primitives.test.tsx` RED: failed on missing primitive imports.
  - `npm test -- src/components/app-shell/app-shell.test.tsx` RED: failed on missing Library route.
  - `npm test -- src/components/app-shell/app-shell.test.tsx src/components/ui/ui-primitives.test.tsx` GREEN: 8 tests passed.
  - `npm run typecheck` GREEN.

## Challenges

- The first primitive RED check exposed that `@testing-library/user-event` was not available in this worktree at that moment, so the test uses `fireEvent` and avoids package changes. The controller later noted the helper was added on the shared branch.
- JSDOM sees both desktop and mobile chrome at once, so existing shell assertions now use `getAllByRole` where responsive duplicate links are expected.
- Other workers have unrelated uncommitted changes in data/seed/assets files; they were left untouched.

## Next Handoff

- Task 5 can rely on the new UI primitives and shell entries for `/app/library` and `/app/crash-course`.
- Library and crash-course routes still need their owned page/component implementations from later workers.
