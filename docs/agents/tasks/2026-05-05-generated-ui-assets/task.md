# Task: Generated UI Assets

## Request

Use generated, cute, flat 2D cartoon assets across Fairplay UI surfaces, including login, characters, helper visuals, crash course scenes, guide helpers, and non-card page illustrations.

## Hard Boundaries

- Do not replace or mutate existing source-card covers in `public/assets/fairplay/cards/`.
- Do not use `gpt-image-2`.
- Use approved Qwen generation only: `qwen-image-2.0-pro`.
- If approved generation fails, record the blocker instead of substituting another model.
- Keep assets original: no readable text, logos, public source deck mimicry, photorealism, 3D renders, or exact real-person likenesses.

## Target Asset Namespace

`public/assets/fairplay/generated-ui/`

## Target Code Surfaces

- `src/components/visuals/fairplay-visuals.tsx`
- `src/components/auth/login-splash-illustration.tsx`
- `src/components/crash-course/crash-course-scene.tsx`
- `src/components/guide/feature-guide-helper.tsx`
- `src/components/library/ai-task-manager.tsx`
- Tests and docs that encode old SVG/CSS visual assumptions.
