# QA Plan

## Focused Automated Checks

- `npm test -- src/components/welcome/persistent-welcome.test.tsx --run`
- `npm test -- src/components/responsibilities/responsibility-load-map.test.tsx --run`
- `npm test -- src/components/app-shell/app-shell.test.tsx --run`
- `npm run typecheck`
- `npm run lint`

## Manual Review Targets

- Confirm the welcome banner no longer repeats the homepage learner action.
- Confirm `/app/home#learn-a-feature` lands on a clearly highlighted learner section.
- Confirm the homepage background reads as a larger learning surface, not a small image trapped in the hub card.
- Confirm Load Map diagnostics and filter groups scan cleanly at desktop and mobile widths.
- Confirm no Load Map lane, move menu, or practice workflow shows `Player 1` or `Player 2`.

## Playwright

- Full Playwright was intentionally not run because the branch brief says not to run it concurrently with other agents.

