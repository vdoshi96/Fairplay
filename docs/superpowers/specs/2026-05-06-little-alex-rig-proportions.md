# Little Alex Rig Proportions Follow-Up

## Goal

Keep the Qwen-generated Little Alex assets, but fix the rig so the assembled character looks like one coherent body instead of separated floating parts. Reduce the idle auto-walk speed by 50%.

## User Requirements

- The Qwen assets look good and should remain the visual source.
- Current proportions are off: head, torso, arms, and legs look disjointed in normal app use.
- The model should assemble more naturally at neck, shoulders, and hips.
- Auto walk speed is too fast; reduce it by 50%.
- Preserve the existing behavior: dragging, flinging, safe area bounds, chat bubble, gaze, reduced motion, and appearance preferences.

## Acceptance Criteria

- The rendered sprite parts fill their rig boxes instead of shrinking into square cells.
- In reduced-motion default pose, head/torso vertical gap is small enough to read as attached.
- Torso/leg vertical connection remains overlapping or nearly touching.
- Arm/torso shoulder bounds still overlap.
- Visual QA screenshots show neutral, masculine, and feminine variants as coherent assembled characters.
- Idle walk per-frame step is half the current value.
- Focused Little Alex unit and Playwright tests pass.
- Final main regression passes and `origin/main` matches local `main`.
