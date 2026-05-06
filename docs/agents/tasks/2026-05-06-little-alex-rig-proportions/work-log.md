# Work Log

## 2026-05-06

- Started from `main` at `bf3cd0c`, which was synced with `origin/main`.
- User reported Qwen assets looked good, but rig proportions were disjointed and idle auto-walk was too fast.
- Planned independent branches for rig proportions, idle speed, and QA.
- On `codex/little-alex-rig-qa`, added Playwright wrapper-geometry checks to the three-presentation Little Alex screenshot flow.
- Captured all three QA screenshots before reporting accumulated proportion failures so visual artifacts remained available while the isolated QA branch failed on expected rig blockers.
- Merged `codex/little-alex-rig-proportions`, `codex/little-alex-idle-speed`, and `codex/little-alex-rig-qa` into `main`.
- Integrated QA exposed a remaining arm/torso overlap issue, so `codex/little-alex-rig-asset-fit` moved the arm anchors inward, trimmed transparent Qwen sprite padding, and strengthened the shoulder unit assertion.
- User review rejected that result because the actual visible sprites still had limb gaps and duplicate clipboard artifacts, proving wrapper-based QA was too weak.
- On `codex/little-alex-pixel-qa`, added `sharp`-based screenshot recognition that diffs rendered frames against hidden-Little-Alex frames and added synthetic coherent/broken fixtures.
- On `codex/little-alex-coherent-full-body`, generated original full-body Qwen assets for all three variants, rendered them as the visible character layer, kept body parts as hidden physics geometry, and added asset pixel QA for cohesion, clipboard count, and proportions.
- Merged `codex/little-alex-coherent-assets`, which documents the original in-repo proportion template and generator prompt contract that avoids internet-copy/licensing issues.
