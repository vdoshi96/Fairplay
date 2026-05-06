# Generated UI Assets Design

## Goal

Replace non-card placeholder, CSS, and SVG artwork with cute, polished, flat 2D generated raster assets while preserving the existing Fairplay source-card covers that come from the reference/PDF workflow.

## Scope

In scope:

- Login page household illustration.
- Persona avatars for Alex and Max.
- Shared helper/mascot imagery, including the AI task manager sidekick.
- App mark, radar visual, check-in visual, and guide helper thumbnails.
- Crash course lesson backgrounds and completion celebration artwork.
- Documentation of tasks, outcomes, and blockers in Markdown.

Out of scope:

- Any file in `public/assets/fairplay/cards/`.
- Source-card cover replacement, source-card generation prompts, or card PDF/reference-derived image handling.
- `gpt-image-2` or any unapproved substitute model.

## Visual Direction

All new art should be original, cute, cartoon-like, flat 2D, warm, and product-polished. It should avoid readable text, logos, watermarks, brand marks, public deck layouts, photorealism, 3D rendering, gender stereotypes, and real-person exact likenesses.

The style should feel like a cohesive app illustration system: rounded forms, soft paper texture, warm off-white backgrounds, balanced teal/blue/coral/gold/green accents, clean compositions, and clear silhouettes that still read when displayed small.

## Architecture

Generated UI art lives in `public/assets/fairplay/generated-ui/`. Components reference that directory through a central asset map so paths stay discoverable and tests can prove card-cover assets are not accidentally changed.

`scripts/generate-ui-assets.mjs` is a separate Qwen-only generator for non-card UI assets. It uses Vercel/local `QWEN_IMAGE_*` configuration, validates PNG responses, writes a manifest, and refuses unapproved models.

## Component Changes

- `src/components/visuals/fairplay-visuals.tsx` remains the shared wrapper for app-wide reusable visuals.
- `LoginSplashIllustration` becomes a generated background illustration rather than layered CSS shapes.
- `CrashCourseScene` renders generated lesson background images keyed by existing lesson scene ids.
- `FeatureGuideHelper` renders generated helper thumbnails keyed by guide id.
- `AiTaskManager` renders a generated sidekick image next to the existing speech bubble.

## Testing

Tests should cover:

- Shared visual components point to generated UI assets, not card assets.
- Login splash renders a generated image and keeps its accessible label.
- Crash course scene ids resolve to generated UI assets and preserve lesson-specific labels.
- Feature guide helper thumbnails resolve to generated UI assets.
- AI task manager sidekick uses the generated image and keeps the speech bubble.
- No test should require visual pixel equality.

## QA

Run focused component tests, full Vitest, typecheck, lint, and build. Use browser verification on login, crash course, library, load map, radar, and check-ins if a dev server is started. Confirm generated images have dimensions matching their expected aspect ratios and are present in `public/assets/fairplay/generated-ui/`.

## Risks

- Qwen generation may produce pseudo-text inside illustrations. Reject/regenerate any asset with readable text.
- Large PNGs may increase repo size. Keep dimensions practical for UI usage and avoid unnecessary multi-megabyte assets.
- Crash course images are decorative but must not reduce contrast or obscure the lesson panel.
- The Little Alex Horne sidekick must stay stylized and cute rather than an exact real-person likeness.
