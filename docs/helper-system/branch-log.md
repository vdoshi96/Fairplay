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

## helper-skin-tone-fix

- Scope: added tone-aware visible sprite paths, centralized skin tone constants, deterministic skin tone asset generation, and 105 generated full/part PNG assets.
- TDD red: focused tests failed because the renderer still used presentation-only sprite paths and the tone assets were missing.
- TDD green: focused tests passed after path changes and generated assets.
- Checks: `npm run assets:generate-little-alex-skin-tones -- --dry-run`, `npm run assets:generate-little-alex-skin-tones`, focused Vitest coverage, `npm run lint`, `npm run typecheck`, and `npm run build` passed.
- Asset note: Qwen was not called on this branch. The script used existing approved Qwen assets as source images and Sharp for deterministic skin-pixel recoloring.

## helper-polish-and-qa

- Scope: tightened the recovery transition so the visible limb layer enters `recovering` before idle pose sync writes neutral transforms.
- QA hardening: added e2e coverage for visible, connected limb sprites during both `flinging` and `recovering`, including full-body fade-out and body-part opacity checks.
- Checks: focused Vitest coverage, `npm run lint`, `npm run typecheck`, `npm run build`, and `npm run test:e2e -- little-alex-physics.spec.ts` passed.
- Documentation: refreshed the README skin-tone root cause text and QA checklist to reflect the implemented tone-aware sprite pipeline.
