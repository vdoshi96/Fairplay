# QA Plan

## Focused Automated Checks

- `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx --run`
- `npm run typecheck`
- `npm run lint`

## Manual Review Targets

- Confirm `/app/load-map` does not horizontally overflow except for the intended board lane scroller.
- Confirm diagnostic tiles wrap long area and hidden-effort summaries.
- Confirm filter groups remain usable on mobile and desktop widths.
- Confirm lane labels and move menu labels remain `Alex` and `Max`.
- Confirm the dummy Load Map practice workflow still moves, edits, trims, and deletes only dummy cards.
