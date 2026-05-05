# Learned: Generated UI Assets

## Repo Structure

- Existing reusable visual components already centralize many app-wide surfaces in `src/components/visuals/fairplay-visuals.tsx`.
- Source-card covers are isolated in `public/assets/fairplay/cards/` and should remain untouched.
- `scripts/generate-visible-assets.mjs` is intentionally source-card oriented and should not be stretched into general UI asset generation.

## Asset Strategy

- A separate generated UI namespace keeps app illustrations distinct from reference/PDF card covers.
- Tests should assert stable image paths, labels, dimensions, and decorative behavior rather than internal artwork construction.
- Crash course scenes can preserve existing lesson scene ids while swapping the internals from inline SVG to generated images.
- Manifest files should store repo-relative paths only; absolute worktree paths make generated outputs harder to review and reuse.
- Running `next build` and Playwright's `next dev` server concurrently can corrupt `.next`; run those verification gates sequentially.

## Model Strategy

- Use Qwen `qwen-image-2.0-pro` for this branch.
- Do not use AI Gateway `gpt-image-1-mini` until the Vercel billing/API-key blocker is resolved.
- Do not use `gpt-image-2`.
- If every requested generated UI asset already exists, the generator can refresh the manifest with `--skip-existing` without loading provider credentials.
