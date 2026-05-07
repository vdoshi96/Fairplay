# Helper Branch Log

## helper-docs-and-investigation

- Commit: `2a5fbc4`
- Scope: documented current helper architecture, ragdoll root cause, skin tone root cause, implementation plan, QA checklist, pain points, asset workflow, and agent handoff.
- Checks: `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Manual QA: not applicable; this branch changed markdown only.

## helper-ragdoll-state

- Scope: added a visual-only ragdoll lifecycle contract with `settled`, `dragging`, `flinging`, and `recovering` states.
- TDD red: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` failed because `data-ragdoll-state` did not exist.
- TDD green: same focused test command passed after adding lifecycle hooks.
- Checks: `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Implementation note: this branch does not reveal limb sprites yet. It only adds the state hooks needed by the limb branch and leaves existing Matter.js velocity, walls, phrase bubble, idle timing, walking speed, and reduced-motion behavior unchanged.

## helper-ragdoll-limbs

- Scope: rendered presentation-specific limb sprites inside the existing Matter.js body-part wrappers and toggled their visibility from the ragdoll visual state.
- TDD red: `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run` failed because `little-alex-sprite` limb images were not present.
- TDD green: same focused test command passed after adding the limb sprite layer and opacity sync.
- Checks: `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Implementation note: the full-body sprite remains the visible settled/idle/reduced-motion character. Limb sprites are visible only for fling/recovery, then hide after the existing recovery timer and transition. The root/body trajectory still follows the existing Matter.js torso body.
