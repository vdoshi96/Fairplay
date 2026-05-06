# Work Log

## 2026-05-06

- Started from `main` at `bf3cd0c`, which is synced with `origin/main`.
- User reported Qwen assets look good, but the rig proportions are disjointed and idle auto-walk is too fast.
- Planned independent branches for rig proportions, idle speed, and QA.
- On `codex/little-alex-rig-qa`, added Playwright wrapper-geometry checks to the three-presentation Little Alex screenshot flow. The checks use `[data-testid="little-alex-body-part"]` and `data-part` rectangles for head/torso, torso/legs, and arm/torso connections.
- Captured all three QA screenshots before reporting accumulated proportion failures so visual artifacts remain available even while the isolated QA branch fails on expected rig blockers.
- Merged `codex/little-alex-rig-proportions`, `codex/little-alex-idle-speed`, and `codex/little-alex-rig-qa` into `main`.
- Integrated QA exposed a remaining arm/torso overlap issue, so `codex/little-alex-rig-asset-fit` was branched from the merged state.
- On `codex/little-alex-rig-asset-fit`, moved the arm anchors inward, trimmed transparent Qwen sprite padding, strengthened the shoulder unit assertion, and verified the branch with focused unit and Playwright runs.
- Merged `codex/little-alex-rig-asset-fit` into `main` and reran focused Little Alex unit/e2e QA with passing results.
- User review rejected that result because the actual visible sprites still had limb gaps and duplicate clipboard artifacts, proving the wrapper-based QA was too weak.
- Branched `codex/little-alex-coherent-full-body`, generated original full-body Qwen assets for all three variants, rendered them as the visible character layer, kept body parts as hidden physics geometry, and added pixel-level asset QA for cohesion, clipboard count, and proportions.
- Merged `codex/little-alex-coherent-assets`, which documents the original in-repo proportion template and generator prompt contract that avoids internet-copy/licensing issues.
