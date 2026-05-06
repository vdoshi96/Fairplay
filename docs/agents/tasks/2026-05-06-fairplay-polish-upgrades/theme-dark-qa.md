# Theme Dark QA

## Scope

- Reworked Settings appearance controls into a system-follow switch plus explicit Light/Dark override buttons.
- Added dark-mode utility overrides for common hard-coded white/stone surfaces that previously became unreadable against light theme text tokens.
- Added real-app dark-mode Playwright screenshot QA across protected routes.

## Screenshot QA

Screenshots captured by `e2e/dark-mode-visual.spec.ts`:

- `test-results/dark-mode-polish/home.png`
- `test-results/dark-mode-polish/library.png`
- `test-results/dark-mode-polish/load-map.png`
- `test-results/dark-mode-polish/radar.png`
- `test-results/dark-mode-polish/check-ins.png`
- `test-results/dark-mode-polish/settings.png`

Vision review found the surfaces readable in dark mode. The remaining visible overlap is global Little Alex floating over page content, which is tracked in the Little Alex branch rather than the theme branch.

## QA

- `npm test -- src/components/settings/settings-panel.test.tsx src/components/theme/theme-provider.test.tsx`: 2 files, 17 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:e2e -- dark-mode-visual.spec.ts`: 1 browser test passed.
