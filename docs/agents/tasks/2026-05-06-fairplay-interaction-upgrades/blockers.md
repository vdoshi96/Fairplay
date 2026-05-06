# Blockers

## Active Blockers

- None.

## Watch Items

- Qwen image provider credentials may be unavailable locally, so tests must mock provider requests and avoid live generation.
- `matter-js` dependency changes will modify `package-lock.json`; merge after other UI-heavy branches to reduce lockfile churn.
- Dark mode may expose hard-coded white surfaces across pages. Scope fixes to shared components and touched pages first, then document remaining visual debt if any.
- Learn-by-doing touches many feature pages and may create conflicts with theme/art branches. Merge it after foundational theme and art work.

## Resolved During Integration

- Root `node_modules` was missing newly merged dependencies (`server-only`, then `matter-js`) until `npm install` was run in the main worktree.
- Local `.worktrees/**/.next` build output caused ESLint to scan generated files; fixed by ignoring `.worktrees/**`.
- Parallel full-suite baseline runs in multiple worktrees created database-heavy timeout noise; rerunning the affected suites sequentially passed.
- Theme review found primary control contrast and hydration risks; fixed before merge.
- Integrated art review found generated-cover classification and Qwen dimension validation risks; fixed before merge.
- Learn-by-doing review found pointer-through dummy workflow risks and dark-theme contrast gaps; fixed before merge.
- Little Alex review found small-viewport containment gaps; fixed before merge.
