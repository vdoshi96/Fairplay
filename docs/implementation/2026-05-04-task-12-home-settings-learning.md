# Task 2: Home, Welcome, and Settings Learning Surfaces

## Expectations

Add practical learning entry points after the guide foundation landed. Home should become a layered learning hub, the persistent welcome should send users to the crash course, App Guide 101, and card library, and settings should expose guided-start controls plus stable guide targets.

## Outputs

- Reworked `/app/home` into a learning hub titled "Learn Fairplay in layers".
- Added primary home actions for Crash course, App Guide 101, and Card library.
- Added home feature cards for Load Map, Library, Radar, Check-ins, and Settings with helper visuals and guide links.
- Updated persistent welcome links and removed the Open load map action.
- Added settings guide markers for persona, guided start, and logout.
- Added settings guided-start copy, App Guide 101 link, and the settings feature guide launcher.

## Verification

- Red run: `npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx` failed for the expected missing home hub, welcome App Guide link, and settings guide markers.
- Green run: `npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx` passed with 3 files and 16 tests.

## Challenges

Adding the settings feature guide launcher introduced a `useSearchParams` dependency in tests that already mocked `next/navigation`; the focused test mocks were updated to include it. Existing uncommitted auth and crash-course changes were left untouched.
