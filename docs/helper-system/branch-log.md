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
