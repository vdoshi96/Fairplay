# Ragdoll Architecture

## Existing Fling Lifecycle

1. Pointer down stores the drag offset from the current torso/root anchor and pauses idle walking.
2. Pointer move clamps the next anchor, translates every Matter.js body by the same delta, zeros velocity, updates gaze, and syncs the DOM.
3. Pointer release records the final drag velocity, sets a longer idle stand delay, and applies velocity/angular velocity to every body.
4. Matter.js advances the separate bodies and constraints.
5. The DOM sync loop currently hides each body-part wrapper and moves the visible full-body sprite to the torso body.
6. After `IDLE_RELEASE_STAND_DELAY_MS`, idle transitions to standing and `setIdlePose` resets all bodies into the clean standing pose.

## Desired Visual State Machine

- `settled`: default. Full-body sprite is visible. Body-part wrappers remain present for physics, hit testing, and QA, but visual opacity is zero.
- `dragging`: full-body sprite remains visible. Body-part wrappers stay hidden so dragging feels identical to today.
- `flinging`: entered on non-reduced pointer release when release speed/distance indicates an actual fling. Full-body sprite fades down or off; body-part sprites become visible and follow constrained Matter.js bodies.
- `recovering`: entered when the existing recovery timer returns idle to standing. Limb/body transforms interpolate back to neutral and opacity transfers back to the full-body sprite.

The state machine must be visual only. It must not change fling trajectory, wall physics, phrase logic, drag targeting, idle timers, or viewport clamping.

## Joint Strategy

The current Matter.js constraints are the primary joint system:

- head to torso at the neck
- left/right arm to upper torso shoulder anchors
- left/right leg to lower torso hip anchors

For visible ragdoll, the body-part wrappers should expose the existing constrained bodies. If extra stabilization is needed, use small bounded impulses and damping rather than changing wall/trajectory behavior. Do not let limb rotations exceed natural-looking ranges:

- head: about -0.45 to 0.45 rad from torso
- arms: about -1.25 to 1.25 rad from torso
- legs: about -0.75 to 0.75 rad from torso

These constraints are visual tuning targets, not a reason to hard-reset physics on every frame.

## Keeping Limbs Attached

The biggest visual risk is exposed gaps. Avoid it through overlapping geometry:

- Keep shoulder and hip wrapper offsets slightly inside the torso silhouette.
- Use transform origins at the joint end, not at the visual center, when CSS child transforms are added.
- Ensure part sprites include shoulder/hip overlap padding.
- During fling, render torso above legs and behind arms where possible.
- During recovery, fade part sprites out only after they are near the neutral pose or after a short transform transition has started.

Do not show part sprites during settled idle unless they visually match the current full-body pose exactly.

## Bounce Impulses

Wall impacts are already handled by Matter.js walls and restitution. Ragdoll limb reactions should be derived from body velocity and body/angular velocity after collision. If an explicit bounce hook is added, listen to Matter.js collision events and apply only small angular velocity adjustments to limbs. Do not alter torso velocity or restitution unless a bug is proven in tests.

## Recovery

Recovery should use the existing idle transition timing. When idle leaves `active` after a release:

1. Enter `recovering`.
2. Apply the `recovering` DOM state before `setIdlePose` writes neutral part transforms, so the recovery transform transition is active before limbs move back.
3. Reveal the full-body sprite.
4. Return to `settled`.

The final settled frame should be the current clean full-body neutral standing sprite.
