# Little Alex Follow-Up Design

## Goal

Make Little Alex feel intentional and controllable: appearance options should be visibly distinct, movement should stay inside the app canvas, idle behavior should be calmer and less predictable, gaze should track user attention, and the speech bubble should appear after real flings rather than ordinary clicks.

## Scope

- Appearance variants: `neutral`, `masculine`, and `feminine` remain presentation options, not identity assertions. Each variant must keep the black suit, white shirt, and clipboard while changing silhouette, hair, and face details enough to be visually distinct.
- Bounds: physics and reduced-motion dragging must keep all body parts out of the desktop side panel and visible app chrome. The allowed area starts to the right of the sidebar at desktop breakpoints and remains inside the viewport on mobile.
- Idle behavior: after a fling or drag release, Little Alex waits longer before standing. Idle standing should be more static, then he should walk in random turn-based directions. Each walking turn travels at least 5% of the available screen width, and he should continue the same direction for at least three turns before a random direction change is allowed.
- Gaze: head/eye styling should respond to pointer movement on desktop and last touch on mobile. The response must be observable in tests through component state or style attributes.
- Fling bubble: the default phrase remains `i'm little alex horne`. The bubble appears after actual drag/fling releases, not simple clicks, and remains tied to the character.

## Branches

- `codex/little-alex-appearance-variants`: presentation-specific classes, visible style tests, settings coverage.
- `codex/little-alex-bounds-idle`: safe bounds, delayed stand-up, calmer idle pose, random turn logic, e2e no-sidebar-overlap coverage.
- `codex/little-alex-gaze-bubble`: gaze direction state, mobile touch tracking, fling-vs-click bubble behavior.

## QA

Each branch must run focused unit tests, typecheck, lint, and relevant Playwright specs. Final `main` QA must run Prisma generation/validation, full Vitest, full Playwright, production build, and visual screenshot inspection where useful.
