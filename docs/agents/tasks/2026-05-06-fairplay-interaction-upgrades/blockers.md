# Blockers

## Active Blockers

- None at kickoff.

## Watch Items

- Qwen image provider credentials may be unavailable locally, so tests must mock provider requests and avoid live generation.
- `matter-js` dependency changes will modify `package-lock.json`; merge after other UI-heavy branches to reduce lockfile churn.
- Dark mode may expose hard-coded white surfaces across pages. Scope fixes to shared components and touched pages first, then document remaining visual debt if any.
- Learn-by-doing touches many feature pages and may create conflicts with theme/art branches. Merge it after foundational theme and art work.
