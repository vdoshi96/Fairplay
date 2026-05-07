# Learned

- Ready AI drafts already flowed through the same client-side `DELETE /api/ai-card-drafts/:id` path used by failed/canceled drafts; the missing pieces were the visible ready-state discard controls and server-side status allowlists.
- Completed crash-course state already had enough preference fields to restart cleanly; the missing path was a page-level completed-state action.
- Radar was embedded in several learning and action surfaces beyond the standalone page: home guide cards, crash course, Load Map diagnostics/filters, card detail actions, and responsibility editor actions.
- The backend still contains Radar persistence and API contracts because check-in internals and historical data models depend on them. The current change retires the partner-facing section rather than dropping storage.
