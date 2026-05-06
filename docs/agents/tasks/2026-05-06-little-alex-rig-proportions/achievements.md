# Achievements

- Planned scoped follow-up for Little Alex rig proportions and idle speed.
- Added Playwright rig geometry assertions that catch disconnected head, torso, arms, and legs.
- Reduced idle auto-walk step speed from `0.72px` to `0.36px`, a 50% reduction.
- Rebalanced the first body-part rig attempt, then replaced the visible presentation with coherent full-body Qwen sprites when screenshot review still showed gaps.
- Added neutral, masculine, and feminine full-body Qwen assets with equal limb proportions, a black suit, white shirt, and exactly one clipboard.
- Kept Matter.js body parts as hidden physics geometry while rendering the coherent full-body sprite as the visible character.
- Added rendered-pixel QA that catches detached visible silhouette islands, large visible part gaps, duplicate clipboard-like tan regions, and left/right leg proportion mismatches.
- Added a synthetic pixel-QA fixture spec proving the recognizer accepts a coherent character and rejects a detached duplicate-clipboard character.
