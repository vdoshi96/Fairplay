# Little Alex Asset Generation

## Existing Qwen Workflow

The configured workflow is:

- Prompt and asset specs: `src/server/ai/little-alex-sprite-assets.ts`
- Generator: `scripts/generate-little-alex-sprites.mjs`
- Command: `npm run assets:generate-little-alex`
- Base output: `public/assets/fairplay/little-alex-sprites/`
- Source sheets: `public/assets/fairplay/little-alex-sprites/source-sheets/`
- Manifest: `public/assets/fairplay/little-alex-sprites/generation-manifest.json`

The generator uses approved model `qwen-image-2.0-pro` and crops 1536x1024 source sheets into 512x512 transparent part sprites.

## Skin Tone Variant Workflow

Implemented route for this task:

1. Use existing approved Qwen assets as source art.
2. Detect skin-colored pixels in full-body and part sprites.
3. Re-map only those pixels to the requested tone while preserving alpha, local lightness, outline pixels, hair, suit, shirt, and clipboard.
4. Write deterministic tone-aware assets into `public/assets/fairplay/little-alex-sprites/`.
5. Record generation details in the manifest or a companion manifest.

This avoids full Qwen regeneration when only tone changes are needed. The command is:

```bash
npm run assets:generate-little-alex-skin-tones
```

The generator is `scripts/generate-little-alex-skin-tones.mjs`. It writes 105 PNGs: 3 presentations x 5 skin tones x 7 rendered assets (`full` plus six ragdoll parts). It also writes `public/assets/fairplay/little-alex-sprites/skin-tone-manifest.json`.

For this fix, Qwen was not called. The current Qwen-approved presentation assets were used as the source images.

## When To Use Qwen Again

Use `npm run assets:generate-little-alex` with the approved env only if:

- deterministic recoloring creates washed-out or inconsistent skin;
- hands/face cannot be reliably detected;
- part and full-body assets cannot be made to match;
- a future art direction change requires new source sheets.

When Qwen is used, update this document with:

- command run;
- env file or provider configuration used, without secrets;
- generated slugs;
- QA screenshots;
- any manual post-processing;
- known rejects or retries.

## Required Asset Contract

Tone-aware assets should follow:

```text
{presentation}-{skinTone}-full.png
{presentation}-{skinTone}-head.png
{presentation}-{skinTone}-torso.png
{presentation}-{skinTone}-leftArm.png
{presentation}-{skinTone}-rightArm.png
{presentation}-{skinTone}-leftLeg.png
{presentation}-{skinTone}-rightLeg.png
```

Compatibility presentation-only assets may remain for legacy references.
