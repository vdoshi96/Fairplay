# Load Map Dashboard Polish

Date: 2026-05-08
Branch: `codex/load-map-dashboard-polish`

## What Changed

- Combined the old hero and dashboard stack into one integrated Load Map header.
- Replaced the transparent multi-group filter tile with a solid `Focus` control strip.
- Reduced dashboard metrics to the highest-signal set: owners, shared, due, and paused/out.
- Shortened lane helper text while keeping lane labels and persisted lane keys unchanged.
- Added a compact reset control for active filters.
- Let Load Map launch the feature guide without the extra helper thumbnail in the header.

## Why

The previous Load Map top area carried too many small panels, repeated explanations, and a low-contrast transparent filter surface. The lane board itself was working well, so this pass keeps the board mechanics intact and focuses the page around quick scanning and filtering.

## Design Decisions

- The generated Load Map background is now part of the header/dashboard instead of competing with a separate dashboard card.
- Filters stay fully visible instead of collapsing behind a disclosure because this page is primarily a board-management workspace.
- Area and effort remain available as filters, but they no longer appear as noisy dashboard summary tiles.
- The guide launcher remains available, but the header no longer repeats the guide artwork.

## QA

- `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx src/components/guide/feature-guide-launcher.test.tsx --run`

## Remaining Risks

- Browser visual QA still needs to be run with the later full responsive pass.
- Very large real households may need a future saved-filter or quick-filter pattern, but this branch keeps behavior unchanged.
