# Visible Asset Generation

This branch uses generated bitmap assets only through approved models:

- Qwen: `qwen-image-2.0-pro`
- Optional OpenAI fallback: `gpt-image-1-mini`

The generator refuses blank models, unknown models, and `gpt-image-2` before any network request.

## Source Card Covers

The first asset class to regenerate is `public/assets/fairplay/cards/*.png`.
Use stable slugs and PNG filenames so seeded card paths and existing tests do not churn.

```bash
npm run assets:generate -- --dry-run --limit=3
npx vercel env run -e production -- npm run assets:generate -- --limit=3
npx vercel env run -e production -- npm run assets:generate -- --write-public
```

The default Qwen size is `1460*2044`, preserving the exact 5:7 card ratio while staying within Qwen Image 2.0 Pro's documented 2048px max resolution.

OpenAI `gpt-image-1-mini` remains an approved image model, but the source-card generator currently fails closed for `--provider=openai` because the OpenAI size options do not provide an exact 5:7 card-cover output without a post-processing step. If Qwen is unavailable and OpenAI is the only configured provider, do not silently switch models or aspect ratios; add and verify a PNG resize/pad pipeline first, or report that generation failed.

## Little Alex Sprite Sheets

Little Alex sprites use `scripts/generate-little-alex-sprites.mjs` and the asset contract in `src/server/ai/little-alex-sprite-assets.ts`.

The safest character strategy is documented in `docs/assets/little-alex-asset-strategy.md`: future source sheets must derive all six cutout cells from the original in-repo proportion template at `docs/assets/little-alex-proportion-template.svg`. Do not use copied internet assets, celebrity/public-figure references, stock mannequins, third-party app mascots, or open-license/public-domain mannequins unless the asset is already local and its license is documented in the repo.

```bash
npm run assets:generate-little-alex -- --dry-run
npm run assets:generate-little-alex -- --reuse-source-sheets --delay-ms=0
```

Use `--reuse-source-sheets` only when preserving reviewed source sheets and recropping transparent sprites. If the source sheets themselves are regenerated, visually inspect every sheet before committing: reject any sheet with an assembled full-body thumbnail, copied-character resemblance, visible labels, unequal left/right limb lengths, mismatched skin/suit/line style, or parts that cannot assemble into one coherent Little Alex.

## Current Blocker

On May 5, 2026, both Preview and Production Vercel env runs exposed the image configuration variables as blank in the local CLI process:

- `QWEN_IMAGE_API_KEY`
- `QWEN_IMAGE_BASE_URL`
- `QWEN_IMAGE_MODEL`
- `OPENAI_IMAGE_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_IMAGE_MODEL`

Because of that, the script correctly failed before generation. Once Vercel/local env exposes one approved configured image provider, rerun the commands above and commit the generated PNGs plus the manifest.
