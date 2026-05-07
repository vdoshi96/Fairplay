# Skin Tone Pipeline

## Current Flow

1. Settings renders five skin tone buttons in `src/components/settings/settings-panel.tsx`.
2. Saving posts `skinTone` to `/api/preferences/little-alex`.
3. Preferences validate through `LittleAlexSkinToneSchema` in `src/contracts/preferences.ts`.
4. `AppShell` passes `littleAlexPreferences.skinTone` into `LittleAlexPhysics`.
5. `LittleAlexPhysics` maps the tone to `--little-alex-skin`.

Steps 1 through 4 work. Step 5 no longer affects the visible helper because the visible character is a PNG full-body sprite. The CSS-rendered skin shapes are hidden legacy geometry.

## Required Rendering Contract

The visible asset path must include both presentation and skin tone:

```text
/assets/fairplay/little-alex-sprites/{presentation}-{skinTone}-full.png
/assets/fairplay/little-alex-sprites/{presentation}-{skinTone}-{part}.png
```

The previous presentation-only paths can remain as compatibility aliases for the default tone, but new rendering should use the tone-aware paths.

## Tone Values

The existing UI swatches are the source of truth:

- `tone_1`: `#f3c7a6`
- `tone_2`: `#d8a078`
- `tone_3`: `#c18463`
- `tone_4`: `#b7795f`
- `tone_5`: `#8f5f45`

`tone_2` is the default and should match current visuals as closely as possible.

## Generation Strategy

Prefer deterministic derivation from the current Qwen-approved base assets when possible. The current assets already have the desired style, outlines, proportions, and pose. Recoloring only skin-colored pixel clusters preserves style better than regenerating all combinations from scratch.

If deterministic recoloring cannot produce consistent tone results, use the configured Qwen workflow in `scripts/generate-little-alex-sprites.mjs` and `src/server/ai/little-alex-sprite-assets.ts` to request tone-specific assets. Any Qwen generation must preserve:

- original Fairplay sidekick identity
- same pose and proportions
- same outline thickness
- same flat 2D texture and lighting
- matching face/body/limb tone within each variant

## QA Expectations

- The selected tone visibly changes the full-body sprite.
- Face, hands, neck, and any visible limb skin share the same tone.
- Suit, hair, outline, shirt, and clipboard remain stable.
- Tone changes do not wash out shadows or outlines.
- Reduced-motion rendering uses the same tone-aware full-body path.
- Fling ragdoll part sprites use the same tone-aware paths as the full-body sprite.
