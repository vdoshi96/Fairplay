# Debugging Log

Root-cause findings:

- Guide dialogs used bottom/right responsive placement on larger screens and had no explicit max-height or internal scroll, making top/right clipping possible.
- Library and Radar practice flows existed, but they read more like local controls than named temporary workspaces with visible artifacts and cleanup.
- Radar practice did not surface temporary data in recognizable Radar sections.
- Check-in preview only rendered an empty list when no agenda suggestions existed, leaving learners without modal feedback.
- Helper text added inside labels changed accessible names during implementation; explicit `aria-label` values were added to keep concise control names.

TDD notes:

- Red tests were added before implementation for dialog placement, guide copy, sandbox workspaces, cleanup, Radar section movement, and empty agenda modal.
- The first focused test run failed on the expected missing behavior.
- After implementation, remaining failures were accessible-name regressions from label helper text; those were fixed without removing the UX copy.

