# Visual Polish Learning Design

## Goal

Improve the visual quality of the guided learning experience so the app feels less diagrammatic and less repetitive: bigger crash-course scenes, richer login art, varied helper characters, and no `App Guide 101` naming.

## Requirements

- Remove the `App Guide 101` terminology from Home, welcome, settings, tests, and browser coverage.
- Keep feature tours user-triggered and available from feature pages.
- Keep the Home learning area, but rename it to plain practical language such as `Learn a feature`.
- Replace repeated helper mascot usage in feature cards and guide launchers with distinct feature-specific helper badges or scenelets.
- Make crash-course lessons visually immersive:
  - The active crash-course illustration should fill the full lesson background.
  - Characters should be visibly larger than the current small SVG figures.
  - Each lesson should have a distinct composition, pose, and prop set.
  - Text should remain readable in a foreground panel.
- Upgrade the login splash:
  - It should read as a warm illustrated household/nature scene, not a line diagram.
  - Use larger characters, richer background layers, and subtle motion.
  - Preserve accessibility via an image role and stable tests.
- Keep the design production-safe:
  - No hotlinked assets.
  - No new external dependencies.
  - Preserve reduced-motion behavior.
  - Keep UI responsive and avoid horizontal overflow.

## Architecture

- Keep visuals in React/Tailwind/SVG so all assets remain local to the repository.
- Extend existing visual components rather than introducing a new image pipeline.
- Split implementation into three slices:
  - Crash-course stage and lesson artwork.
  - Login splash illustration.
  - Home/welcome/settings copy plus feature-guide helper variation.

## Verification

- Focused Vitest tests for each slice.
- Full `npm run lint`, `npm run typecheck`, `npx vitest run`, `npm run build`, and Playwright checks before PR.
- Browser-visible assertions should verify that `App Guide 101` is absent and that larger crash/login visuals render.
