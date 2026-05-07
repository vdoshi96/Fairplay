# Helper Pain Points

## Coherent Full-Body Asset Vs Ragdoll

The current full-body PNG solved previous detached-looking part problems, but it also hides the ragdoll simulation. The safest implementation keeps the full-body image for settled states and reveals parts only while the fling makes limb motion valuable.

## Hidden CSS Skin Variable

`--little-alex-skin` is still present and tested, but it is no longer a visible rendering mechanism. Future tests should assert the visible sprite path and pixel/tone behavior, not only the CSS variable.

## Legacy CSS Shape Rules

`src/app/globals.css` still contains old CSS character shape rules, then neutralizes them at the end by setting backgrounds, borders, and torso pseudo-elements to transparent. That can confuse future agents. Treat the old rules as semantic/testing scaffolding unless visible CSS parts are intentionally restored.

## Asset Drift

Qwen can create excellent assets, but repeated generation risks pose, outline, and lighting drift. Prefer deriving tone variants from approved base assets when the only intended change is skin color. Use Qwen only when deterministic derivation fails visual QA.

## Browser QA Cost

The Playwright Little Alex spec creates accounts/personas and captures screenshots. It is the best regression guard, but it can take longer than focused unit tests. Use focused unit tests for red/green work and run full e2e during polish/final QA.
