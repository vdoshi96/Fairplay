# 2026-05-09 Dynamic Redesign

## Summary

Implemented the approved redesign as a theme-adaptive polish pass rather than a fixed light/white skin. The app now uses dynamic Fairplay CSS tokens for page gradients, chrome, panels, cards, and inputs across the main app routes, auth routes, card workflows, Library/Ask Greg/Check-ins/Theory/Settings/Onboarding, and responsibility detail/edit surfaces.

Existing public app assets were preserved. The mock-only imagery was not copied into the app or used to replace runtime assets.

## Notable Changes

- Added dynamic surface tokens in `src/app/globals.css` for light/dark page gradients, panels, chrome, card surfaces, and inputs.
- Restyled the shared app shell, page shell, UI primitives, auth shell/forms, and persistent welcome banner around the dynamic tokens.
- Updated card, board, library, AI draft, Ask Greg, check-in, crash-course, onboarding, settings, and responsibility screens to use the new adaptive surfaces while keeping current routing and product behavior.
- Increased the dark-mode visual QA timeout because the multi-page full-page screenshot loop now carries a heavier rendered visual pass.

## Verification

```bash
git diff --check
npm run prisma:validate
npm run lint
npm run typecheck
npm test -- --run
npm run build
npx playwright test e2e/dark-mode-visual.spec.ts
npx playwright test e2e/little-alex-physics.spec.ts -g "uses a static draggable-safe mode with reduced motion"
npm run test:e2e
```

Rendered Browser QA used a real local authenticated household and visited `/app/your-cards`, `/app/distribute`, `/app/board`, `/app/ask-greg`, `/app/check-ins`, `/app/crash-course`, `/app/library`, `/app/settings`, and `/app/onboarding`. Each page rendered a main region with the expected heading and zero console errors.
