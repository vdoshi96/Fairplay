# Achievements

- Planned scoped follow-up for Little Alex rig proportions and idle speed.
- Added Playwright rig geometry assertions that catch the disconnected head, torso, arms, and legs visible in the user's screenshots.
- Rebalanced the first body-part rig attempt, then replaced the visible presentation with coherent full-body Qwen sprites when screenshot review still showed gaps.
- Reduced idle auto-walk step speed from `0.72px` to `0.36px`, a 50% reduction.
- Trimmed transparent Qwen sprite padding so generated body parts occupy their wrappers naturally.
- Added neutral, masculine, and feminine full-body Qwen assets with equal limb proportions, a black suit, white shirt, and exactly one clipboard.
- Added pixel-recognition QA over the actual rendered assets for connected silhouette, central single clipboard, human-like aspect ratio, and left/right leg proportion symmetry.
- Verified the coherent full-body branch with focused unit and browser QA before merging to `main`.
