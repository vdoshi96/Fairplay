# Helper Ragdoll And Skin Tone Implementation Plan

> For agentic workers: use Superpowers workflows, keep each branch focused, run checks after each branch, and merge only branches created for this helper track.

## Branch Order

1. `helper-docs-and-investigation`
   - Document current architecture, root causes, QA plan, and handoff.
   - No runtime behavior changes.

2. `helper-ragdoll-state`
   - Add visual ragdoll lifecycle state and test-only observability.
   - Wire release and recovery transitions without changing velocity, walls, phrases, walking, or reduced-motion behavior.

3. `helper-ragdoll-limbs`
   - Render body-part sprites only during fling/recovery.
   - Keep full-body sprite for settled idle/standing.
   - Add overlap and transition tuning to avoid gaps.

4. `helper-skin-tone-fix`
   - Add tone-aware asset contracts and rendering paths.
   - Generate or derive missing full-body and part tone assets.
   - Extend unit, asset, and e2e checks for visible tone changes.

5. `helper-polish-and-qa`
   - Tune motion and visual layering.
   - Run final focused tests, lint, typecheck, build, and browser QA.
   - Update QA docs with evidence and limitations.

## TDD Targets

- Ragdoll state:
  - drag release with meaningful velocity sets `data-ragdoll-state="flinging"`.
  - simple click release does not enter fling ragdoll.
  - after existing recovery timer, state returns through recovery to settled.

- Ragdoll limbs:
  - body-part sprites exist during fling.
  - body-part opacity is visible during fling and hidden when settled.
  - the full-body sprite remains the settled neutral visual.
  - shoulder and hip wrappers overlap in reduced/settled and visible fling states.

- Skin tone:
  - rendered full-body src includes presentation and tone.
  - every tone maps to a distinct visible sprite path.
  - settings save keeps sending the selected tone.
  - asset specs include all presentation/tone combinations.

## Regression Risks

- Reintroducing visible detached limb sprites in idle.
- Changing the current full-body default neutral pose.
- Double-rendering body parts over the full-body sprite outside fling.
- Using CSS filters that recolor suit, outlines, or clipboard.
- Letting a skin tone save update state but not the visible image src.
- Altering torso velocity or wall restitution while trying to add bounce reactions.

## Rollback Notes

Each branch should be independently revertible. If ragdoll visuals regress, revert the state/limb branches while keeping skin tone asset fixes. If generated tone assets are rejected, keep the rendering path contract and regenerate assets from the documented workflow.
