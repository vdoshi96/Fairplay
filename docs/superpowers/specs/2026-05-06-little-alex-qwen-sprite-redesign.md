# Little Alex Qwen Sprite Redesign

## Goal

Replace the CSS-only Little Alex appearance with Qwen-generated raster sprite assets while preserving the existing Matter.js drag, fling, idle, gaze, chat bubble, settings, and safe-area behavior.

## User Requirements

- All three Little Alex appearance variants must look visibly different.
- The feminine variant must have long hair.
- Shoulders must attach naturally to the torso; arms should not appear detached from the suit.
- Little Alex must keep a black suit, white shirt, and clipboard across all variants.
- Use the Qwen image API for the new appearance assets and animate those assets inside the existing app.
- Keep Little Alex inside the app play area, including to the right of the desktop sidebar.
- Preserve the current behavior: draggable/flingable physics, standing delay after release, idle standing and walking, gaze toward cursor or last touch, and fling-triggered chat bubble.

## Design Decisions

- Use transparent PNG sprite parts for `head`, `torso`, `leftArm`, `rightArm`, `leftLeg`, and `rightLeg`.
- Keep the existing six Matter.js bodies so ragdoll physics, tests, and e2e selectors remain stable.
- Render each body part as a Qwen sprite image inside the existing transformed part wrapper.
- Generate one sprite set per presentation: `neutral`, `masculine`, and `feminine`.
- Avoid real-person likeness prompting. The implementation may keep the product name "Little Alex" in code and UI, but the image prompts must request original sidekick artwork, not an imitation of a real person.
- Generate assets with a chroma background, remove the chroma key into alpha, and commit only the transparent production sprites plus generation metadata.

## Acceptance Criteria

- Variant switching changes the raster sprite paths and the visible silhouette/hair. Feminine head asset has long hair in the generation prompt and committed asset.
- Body part DOM order remains `head`, `torso`, `leftArm`, `rightArm`, `leftLeg`, `rightLeg`.
- Reduced-motion and physics modes both render sprite images, not visible CSS-drawn body pieces.
- Arms overlap the torso shoulder area in reduced-motion layout by at least one pixel.
- Existing Little Alex unit and Playwright behavior tests continue to pass after the sprite replacement.
- A visual QA screenshot is captured for the three appearance variants and inspected.
- Main is pushed and verified so local `HEAD` matches `origin/main`.
