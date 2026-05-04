# Gaps

- No blocking gaps found in this rereview.
- Non-blocking note: responsibility and radar side effects are applied after the decision/item transaction, so a late downstream service failure can report an error after the decision has been recorded. The fix is coherent enough for the prior findings because targets are guarded and create/link is atomic, but full effect-level atomicity is not implemented.
- The Playwright check-in coverage remains route-mocked, so it is useful for user flow regression but not a DB-backed end-to-end persistence proof.
