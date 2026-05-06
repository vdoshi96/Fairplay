# Little Alex Coherent Asset Strategy

## Decision

Use an original in-repo full-body proportion template as the contract for future Little Alex sprite generation. Do not use copied internet assets, celebrity/public-figure references, app mascots, stock mannequins, or third-party body templates.

The local repository does not contain a documented open-license or public-domain mannequin asset. Because there is no local license evidence to cite, the safest path is the project-owned template at `docs/assets/little-alex-proportion-template.svg` plus the matching prompt contract in `src/server/ai/little-alex-sprite-assets.ts`.

## Existing Source Sheet Review

Checked local Qwen source sheets:

- `public/assets/fairplay/little-alex-sprites/source-sheets/neutral-sheet.png`
- `public/assets/fairplay/little-alex-sprites/source-sheets/masculine-sheet.png`
- `public/assets/fairplay/little-alex-sprites/source-sheets/feminine-sheet.png`

The sheets are local generated PNGs with no documented external source image. The manifest already identified Qwen `qwen-image-2.0-pro`, and this change adds an explicit original proportion-template record to the asset contract and manifest prompts.

## Asset Contract

The contract now requires:

- One coherent imagined full-body character before parts are separated.
- A single shared centerline, balanced shoulders and hips, and compact 3.2 to 3.5 head-height proportions.
- Equal left/right arm length, sleeve width, hand scale, shoulder-cap size, and line weight.
- Equal left/right leg length, shoe scale, ankle width, and line weight.
- No internet image reference, third-party mannequin, real-person likeness, public figure resemblance, copied mascot, logo, or watermark.

The SVG template is for human QA and documentation. The generation script remains text-prompt based, so the same geometry is encoded directly in `buildLittleAlexSpritePrompt`.

## Regeneration Flow

1. Review `docs/product/ip-safety-review.md`, `docs/product/visual-system.md`, and this strategy.
2. Keep the template provenance unchanged unless a new template is created in-repo and documented.
3. Run a dry run first:

```bash
npm run assets:generate-little-alex -- --dry-run
```

4. If regenerating source sheets, use only the approved Qwen model in the contract and inspect the source sheets before committing cropped sprites.
5. Reject any sheet that shows a copied character, grid labels/text, assembled full-body thumbnails, unequal limb pairs, mismatched suit/skin/line style, or body parts that cannot assemble into one coherent Little Alex.
6. Keep e2e pixel QA in the QA-owned branch/worktree. This asset work should update prompts, manifests, source sheets, or docs only.

## License Position

`docs/assets/little-alex-proportion-template.svg` is an original project asset created for Fairplay. It is not a public-domain mannequin and does not rely on an external license. If a future task proposes a public-domain/open-license mannequin, it must be present locally with its license file or source citation documented before use.
