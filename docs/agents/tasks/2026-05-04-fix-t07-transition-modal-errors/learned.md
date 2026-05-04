# Learned

- Radar had dedicated publish, defer, resolve, and schedule routes already; dismiss was the only transition still routed through generic PATCH.
- Settings already contains a keyboard-modal dialog pattern with `aria-modal`, `inert`, focus movement, Escape, Tab wrapping, and focus restoration that guided the radar publish confirmation.
- `RadarSummary` includes `deferredUntil` but not `resolvedAt` or `targetCheckInId`, so stale revisit display is the board-visible metadata risk.
- Next build and Playwright should not be run concurrently in this workspace because they can race on Next build artifacts; rerun build alone for the reliable signal.
