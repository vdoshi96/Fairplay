# Gaps And Blockers: Generated UI Assets

## Active Blockers

- None at task start. Qwen production env worked in the previous probe with `qwen-image-2.0-pro`.

## Watch Items

- Existing Vercel AI Gateway `openai/gpt-image-1-mini` path returned HTTP 403 because AI Gateway requires a valid credit card on file. This branch does not depend on that path.
- Qwen may produce pseudo-text in images. Any asset with readable text or logo-like marks must be regenerated or omitted.
- Large generated PNGs may increase repository size. Keep dimensions practical and verify file sizes.
- Current tests assert internal CSS/SVG shape test ids. Tests must shift to stable public contracts.
- The AI task manager sidekick must remain stylized and original, not an exact Alex Horne likeness or Taskmaster-branded image.
