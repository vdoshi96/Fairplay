# UX Foundation: Backgrounds And Copy

Date: 2026-05-08

## What Changed

- Increased global generated background visibility in the app shell.
- Added theme-aware page and hero washes so artwork is visible without reducing text contrast.
- Reworked the Home learning hub background treatment so the art spans the page surface and the main tile stays readable.
- Shortened Home and Settings copy while preserving the same navigation, guide, persona, theme, and learning actions.
- Added the ordered multi-PR implementation plan at `docs/superpowers/plans/2026-05-08-app-ux-polish-pr-plan.md`.

## Why

The generated backgrounds were present but too muted to read as intentional. Home and Settings also carried more explanatory copy than the workflow needed. This branch creates a visual/copy foundation before page-specific redesign branches build on it.

## Design Decisions

- Use existing generated assets; no private `References/` files were opened.
- Keep 8px radii, Fairplay tokens, and mobile-first density.
- Use stronger artwork opacity plus lighter/darker washes rather than placing text directly on raw art.
- Keep feature-guide button labels stable where tests and onboarding flows expect them.

## QA

```bash
npm test -- src/components/app-shell/app-shell.test.tsx src/components/settings/settings-panel.test.tsx --run
```

Result: 2 files, 25 tests passed after the red run failed on the old copy/background assertions.

## Remaining Risks

- Browser visual QA for desktop/mobile backgrounds will happen after all page-specific branches are merged.
- Load Map, Library, Check-ins, and Crash Course copy/polish are intentionally left for later PRs in the documented order.
