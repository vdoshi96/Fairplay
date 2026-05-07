# Architecture Decision

## Decision

Horizontal overflow is owned by the Load Map lane rail, not by the page shell or the Load Map root section.

## Root Cause

Previous corrective work added `overflow-x-clip` to both the protected PageShell and the Load Map dashboard root. That prevented document-level overflow tests from failing, but it also hid real layout pressure and left the populated six-lane board dependent on an understated nested scroller. Users could see lanes cut off without an obvious, reliable way to move through them.

The six board lanes are intentionally wider than the viewport. The bug was not that the lane strip was wide; the bug was that the correct scroll boundary was not explicit enough.

## Implementation Notes

- `PageShell` no longer clips horizontal overflow and its content wrapper now has `min-w-0`.
- `ResponsibilityLoadMap` root no longer clips horizontal overflow.
- The board section now frames the lane rail as an explicit work area with a heading, short instruction, and left/right icon controls.
- The scroller has `aria-label="Responsibility lanes"`, `tabIndex={0}`, `max-w-full`, `overflow-x-auto`, `overscroll-x-contain`, `touch-pan-x`, and stable scrollbar gutter behavior.
- The lane strip uses `w-max min-w-full` so empty/short states still fill the board while all six lanes can extend horizontally.
- Diagnostics use an auto-fit grid instead of a fixed `xl:grid-cols-8` layout that ignored the PageShell content reserve for Little Alex.

## Preserved Behavior

- Document-level horizontal overflow remains disallowed.
- `BOARD_LANES` and internal `player_1` / `player_2` ids remain unchanged.
- User-facing lane labels remain Alex and Max.
- Guide targets are preserved: `load-map-board`, `load-map-lanes`, `load-map-move-target`, and `load-map-filters`.
- Drag/drop and keyboard move-menu behavior remain covered by existing component tests.

## Risks And Future Recommendations

- Removing PageShell clipping may reveal unrelated overflow on future pages; keep the corrective responsive visual spec as the guardrail.
- Drag gestures still attach to the whole card. If touch users report competition between dragging and lane panning, add a dedicated drag handle in a follow-up.
- The lane rail now has explicit scroll buttons; a future polish pass could add disabled states at scroll boundaries.
