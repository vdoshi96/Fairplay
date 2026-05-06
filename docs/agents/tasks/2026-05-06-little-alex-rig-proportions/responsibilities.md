# Responsibilities

## Branch Ownership

- `codex/little-alex-rig-proportions`: rig part dimensions, offsets, sprite fill behavior, and component tests.
- `codex/little-alex-idle-speed`: idle walking speed reduction and focused unit coverage.
- `codex/little-alex-rig-qa`: Playwright screenshot/e2e QA and final evidence docs.

## Shared Rules

- Work from current `main`, which includes the visual-background commits after the first Qwen sprite work.
- Do not regenerate Qwen assets unless a blocker proves the rig cannot be fixed with layout.
- Do not revert unrelated visual-background work.
- Preserve Little Alex drag/fling, safe-area, bubble, gaze, reduced-motion, and preference behavior.
