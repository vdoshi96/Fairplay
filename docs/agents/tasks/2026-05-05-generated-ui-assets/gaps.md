# Gaps And Blockers: Generated UI Assets

## Active Blockers

- None for this branch.

## Resolved During Implementation

- Qwen returned HTTP 429 after three rapid UI asset generations. Mitigation: added retry/backoff, a default delay between assets, and resume with `--skip-existing`.
- The first retry/backoff implementation hit a script ordering bug when a retryable provider error was thrown. Mitigation: moved `ProviderHttpError` above top-level generation before resuming.
- The generated manifest initially recorded absolute worktree paths. Mitigation: changed the generator to write repo-relative paths and refreshed the manifest.
- A parallel build/E2E run corrupted generated `.next` output. Mitigation: stopped the run, cleared `.next`, and reran build plus Playwright sequentially.

## Watch Items

- Existing Vercel AI Gateway `openai/gpt-image-1-mini` path returned HTTP 403 because AI Gateway requires a valid credit card on file. This branch does not depend on that path.
- Worktree-local `vercel env run` did not expose `QWEN_IMAGE_*`; root checkout Vercel context loaded those values from `/Users/vishal/Developer/Fairplay/.env.local`. Generation should run from root Vercel context while targeting the worktree until the worktree env is hydrated.
- Qwen may produce pseudo-text in images. Any asset with readable text or logo-like marks must be regenerated or omitted.
- Large generated PNGs may increase repository size. Keep dimensions practical and verify file sizes.
- Existing legacy non-card SVGs remain in `public/assets/fairplay/`, but app runtime and browser tests now use generated PNGs.
- The AI task manager sidekick must remain stylized and original, not an exact Alex Horne likeness or Taskmaster-branded image.
