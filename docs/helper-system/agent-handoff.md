# Agent Handoff

## Shared Rules

- Do not redesign Little Alex.
- Do not change the default full-body neutral pose.
- Do not change phrases, walking speed, walking direction, wall geometry, fling velocity, or idle timing unless a failing test proves the existing behavior is broken.
- Only merge branches created for this helper track.
- Sync from `origin/main` when needed, but do not merge another agent's feature branch.

## Branch Responsibilities

- `helper-docs-and-investigation`: docs only.
- `helper-ragdoll-state`: visual lifecycle state only.
- `helper-ragdoll-limbs`: visible limb mechanics and connection tuning only.
- `helper-skin-tone-fix`: tone-aware assets/rendering only.
- `helper-polish-and-qa`: tuning, docs updates, browser QA, final checks only.

## Sub-Agent Roles Used

- Ragdoll/physics explorer: map Matter.js lifecycle and tests.
- Skin tone/assets explorer: map UI preference propagation, asset specs, and Qwen workflow.

## Current Best Guess

The least risky solution is hybrid rendering:

- settled states use the current coherent full-body sprite;
- fling/recovery states reveal constrained body-part sprites;
- visible asset paths include both presentation and skin tone;
- generated tone variants are derived from the current approved Qwen assets unless visual QA forces new Qwen generation.

## Final Evidence To Capture

- Commit list per branch.
- Files changed.
- Checks run and outcomes.
- Browser/manual QA notes.
- Whether Qwen was called.
- Final local `main` SHA.
- Final `origin/main` SHA.
- Confirmation that local `main` and `origin/main` match after pushing.
