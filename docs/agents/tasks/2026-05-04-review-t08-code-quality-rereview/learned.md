# Learned

- The fix covers the main responsibility-target hole by requiring responsibility decision input to match the current check-in item relationship before any decision is persisted.
- `recordDecisionForItem` now wraps decision creation and item linkage in a Prisma transaction, with active check-in, queued/deferred item, and `decisionId: null` guards repeated at write time.
- Guided-flow failure handling is covered at the component level for skip, defer, decision, and complete mutations, including duplicate-submit blocking and preserving decision fields after save failure.
- The downstream responsibility/radar effects still run after the create/link transaction. This is acceptable for this rereview because the prior minimum atomicity requirement was decision create plus item link, but it remains worth considering for a future stronger consistency pass.
