# Task 23: Learning Copy and Guide Helpers

## Expectations

- Rename the Home learning anchor to `learn-a-feature`.
- Update Home, welcome, settings, tests, and e2e copy to use plain learning/replay language.
- Keep feature guide query behavior and the `Learn this feature` action intact.
- Add feature-specific helper scenelets for `loadMap`, `library`, `radar`, `checkIns`, and `settings`.
- Use the new helpers in both the guide launcher and Home feature cards.

## Outputs

- Home primary actions are now `Crash course`, `Card library`, and `Learn a feature`.
- Welcome links to `/app/home#learn-a-feature` with `Learn a feature` copy.
- Settings links back to `/app/home#learn-a-feature` with `Open learning hub` copy.
- Added `FeatureGuideHelper` with five distinct scenelets and wired it into Home cards and `FeatureGuideLauncher`.
- Updated Vitest and Playwright expectations around the renamed learning target.

## Verification

- Red check: `npx vitest run src/components/app-shell/app-shell.test.tsx src/components/welcome/persistent-welcome.test.tsx src/components/settings/settings-panel.test.tsx src/components/guide/feature-guide-launcher.test.tsx src/components/guide/feature-guide-helper.test.tsx` failed before implementation for the missing `Learn a feature` links and missing feature helper scenes.
- Green check: same Vitest command passed with 5 test files and 20 tests passing.
- Lint: `npx eslint` on the owned code and test files exited 0.
- Copy scan: `rg` over the owned code/test/e2e files found no matches for the retired guide wording or old anchor.

## Challenges

- The first green attempt exposed an unsupported matcher in the new helper test; it now uses a plain `Set.size` assertion and the focused suite was rerun.
