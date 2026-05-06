# Achievements

## Planned

- Branches and QA strategy defined for Little Alex follow-up fixes.

## Completed

- Added visibly distinct neutral, masculine, and feminine Little Alex presentation variants while preserving the black suit, white shirt, clipboard, six physics body parts, and drag target.
- Added desktop play-area bounds so physics and reduced-motion dragging stay to the right of the 16rem sidebar.
- Reworked idle behavior into a calmer `active -> standing -> walking` flow with a 6.5s post-release stand-up delay, 4s standing pause, 5% minimum walk turns, and a three-turn minimum before random direction changes.
- Added resize-safe idle target clamping so Alex cannot keep walking toward an unreachable pre-resize target.
- Added observable desktop pointer and mobile last-touch gaze through `data-gaze-direction` and CSS variables.
- Changed chat bubble behavior so clicks do not trigger the phrase, while real drag/fling releases do.
- Merged feature branches to `main` in order: appearance, bounds/idle, then gaze/bubble.
