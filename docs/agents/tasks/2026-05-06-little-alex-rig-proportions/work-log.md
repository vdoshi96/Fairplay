# Work Log

## 2026-05-06

- Started from `main` at `bf3cd0c`, which is synced with `origin/main`.
- User reported Qwen assets look good, but the rig proportions are disjointed and idle auto-walk is too fast.
- Planned independent branches for rig proportions, idle speed, and QA.
- On `codex/little-alex-rig-qa`, added Playwright wrapper-geometry checks to the three-presentation Little Alex screenshot flow. The checks use `[data-testid="little-alex-body-part"]` and `data-part` rectangles for head/torso, torso/legs, and arm/torso connections.
- Captured all three QA screenshots before reporting accumulated proportion failures so visual artifacts remain available even while the isolated QA branch fails on expected rig blockers.
- On `codex/little-alex-pixel-qa`, added `sharp`-based screenshot recognition that diffs the rendered frame against a hidden-Little-Alex frame, then checks the actual visible pixels for one near-connected silhouette, no large part gaps, and exactly one clipboard-like tan cluster.
- Added a synthetic Playwright QA spec with one coherent fixture and one deliberately broken detached/duplicate-clipboard fixture so future threshold changes prove they still catch the user-reported failure mode.
