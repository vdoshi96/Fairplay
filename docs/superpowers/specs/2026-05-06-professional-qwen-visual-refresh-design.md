# Professional Qwen Visual Refresh Design

## Goal

Make Fairplay feel more like a polished professional web product by adding original Qwen-generated backgrounds and page art across auth, onboarding, home, and app feature pages while preserving the existing Fairplay source-card cover assets.

## Scope

In scope:

- Generate a cohesive set of non-card backgrounds with the existing Qwen image API pipeline.
- Keep generated art in `public/assets/fairplay/generated-ui/`.
- Use page-level imagery as quiet product polish: backdrops, hero panels, and contextual visual accents.
- Split implementation across isolated branches so asset generation, auth/home surfaces, and feature-page surfaces can be tested independently.
- Document task ownership, blockers, achievements, branch ordering, and verification results in Markdown.

Out of scope:

- Replacing source-card covers under `public/assets/fairplay/cards/`.
- Changing application data models, authentication behavior, AI card generation behavior, or Little Alex physics.
- Adding a second image-generation provider or bypassing the approved Qwen model guard.

## Visual Direction

The new assets should feel cohesive with the current cute flat 2D Fairplay illustration system while moving the page composition closer to a modern SaaS/product site. Backgrounds use warm paper texture, balanced teal, blue, coral, gold, green, and ink accents, and abstract household-operation motifs such as blank tiles, signal paths, shelves, agenda loops, and persona dots.

The art must avoid readable text, pseudo-writing, logos, watermarks, photorealism, 3D rendering, card-deck mimicry, public-figure likenesses, blame, shame, or gendered chore stereotypes.

## Architecture

The asset branch extends `src/server/ai/generated-ui-assets.ts` with a `professionalPageBackgroundSpecs` group. It writes PNGs under `public/assets/fairplay/generated-ui/backgrounds/` and refreshes the manifest through `scripts/generate-ui-assets.mjs`.

The UI branches should consume those generated files through shared visual helpers rather than hard-coding repeated image markup in every page. The app shell can carry a subtle global canvas, while individual pages use contextual backgrounds where they help orientation.

## Branch Plan

1. `codex/visual-asset-system`: add Qwen background specs, generate PNG files, refresh manifest, and verify asset-file tests.
2. `codex/visual-auth-home`: wire the auth shell, home learning hub, and onboarding flow to the new backgrounds.
3. `codex/visual-feature-pages`: wire Load Map, Library, Radar, Check-ins, and Settings to the new backgrounds and contextual page visuals.
4. Merge the branches into `main` in that order so UI branches consume committed image files.

## Testing

Asset tests prove every declared PNG exists, is non-empty, stays below the repo size limit, and has the declared dimensions. Component tests should check generated image paths, labels, layout hooks, and that the UI remains accessible without relying on pixel snapshots.

Full QA after merging should include `npm run lint`, `npm run typecheck`, `npm run test -- --run`, `npm run build`, and Playwright end-to-end coverage.

## Risks

- Qwen can occasionally return pseudo-text; each generated asset needs visual inspection before final merge.
- Large PNGs can bloat the repo; each generated asset remains below the existing 8 MB guard.
- Background imagery can reduce contrast; UI wiring must place text on solid or strongly overlaid surfaces.
- Parallel branches can conflict if they edit shared visual files; branch ownership keeps changes isolated and merge order explicit.
