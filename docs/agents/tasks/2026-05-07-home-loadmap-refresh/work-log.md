# Work Log

## 2026-05-07

- Investigated homepage, persistent welcome, Load Map board lanes, and existing focused tests.
- Added failing expectations for removing duplicate welcome learner links, adding clearer homepage anchor semantics, grouping Load Map filters, and replacing Player lane copy.
- Implemented welcome cleanup by keeping crash course and card library actions only.
- Expanded the homepage generated background to the full learning surface and made the primary `Learn a feature` action describe the anchored learner section.
- Refreshed Load Map diagnostics and filter layout inside a thematic workbench surface.
- Updated lane metadata and practice workflow copy from `Player 1`/`Player 2` to `Alex`/`Max`.

## Rollback Notes

- Revert this branch commit to restore the prior welcome actions, homepage card-only background, flat Load Map filters, and Player lane labels.
- If only lane copy causes merge friction, `src/components/responsibilities/board-lanes.ts` and the practice-board strings in `responsibility-load-map.tsx` are the narrow rollback area.

