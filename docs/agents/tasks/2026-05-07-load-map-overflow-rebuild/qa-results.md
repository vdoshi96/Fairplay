# QA Results

## Automated Results

- `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx --run`: passed, 12 tests.
- `npm test -- src/components/app-shell/app-shell.test.tsx --run`: passed, 8 tests.
- `npm run test:e2e -- corrective-responsive-visual.spec.ts --grep "populated Load Map"`: passed, 1 Playwright test.
- `npm run test:e2e -- corrective-responsive-visual.spec.ts`: passed, 2 Playwright tests.
- `npm test -- --run`: passed, 96 files and 528 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## Browser Validation

- Browser plugin path was attempted first per frontend testing guidance.
- Browser DOM validation opened `http://localhost:3000/app/load-map`, created a household, chose Alex, created a responsibility, loaded the populated Load Map, confirmed the page identity, confirmed meaningful content, confirmed scroll controls existed, clicked both lane scroll buttons, and found no Browser console errors or warnings.
- Browser screenshot capture timed out through CDP, so Playwright screenshots were used for visual evidence.

## Visual Evidence

Playwright wrote responsive screenshots under `test-results/corrective-responsive-visual/`.

High-signal Load Map files:

- `mobile-load-map.png`
- `small-tablet-load-map.png`
- `desktop-load-map.png`
- `short-desktop-load-map.png`
- `populated-mobile-load-map.png`
- `populated-small-tablet-load-map.png`
- `populated-desktop-load-map.png`
- `populated-short-desktop-load-map.png`

## QA Findings

- Empty Load Map remains responsive across mobile, small tablet, desktop, and short desktop.
- Populated Load Map has no document-level horizontal overflow across the same viewport matrix.
- Populated lane rail has `scrollWidth > clientWidth`, so the board owns the horizontal overflow.
- Scroll buttons change `scrollLeft`.
- The `Trimmed` lane can be revealed inside the lane rail.
- Filters remain usable and wrap within the dashboard.
- Little Alex remains visible in the full corrective responsive visual matrix.

## Blockers

- No unresolved implementation blockers.
- In-app Browser screenshot capture timed out, but Browser DOM/interactions and Playwright screenshots covered the rendered behavior.
