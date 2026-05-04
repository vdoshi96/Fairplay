# Gaps

## Findings

### P1: Decision side effects can target unrelated responsibilities and are not tied to the check-in item

`src/server/check-ins/service.ts:385` validates that the `itemId` exists in the check-in, but `src/server/check-ins/service.ts:405` applies `input.responsibilityId` and `input.responsibilityEffect` without proving that the responsibility is the item's responsibility or a related responsibility from the item's radar topic. A client can post a decision for one agenda item while mutating any other household responsibility id that downstream responsibility services accept. This violates the "related responsibility" boundary and makes summaries and responsibility history diverge from what was actually discussed.

Required fix: validate the decision's responsibility id against the current item relationship before creating the decision or applying effects. Reject mismatched responsibility ids, and add service/API tests for radar item linked responsibility, responsibility agenda item, custom item without responsibility, and mismatched household-local responsibility id.

### P1: Recording a decision is not transactionally safe and can leave orphan or misleading check-in state

`src/server/check-ins/service.ts:390` creates the decision, `src/server/check-ins/service.ts:398` marks the item discussed, then `src/server/check-ins/service.ts:405` and `src/server/check-ins/service.ts:413` apply responsibility/radar side effects in later awaits. If the item update or either side effect fails, the check-in can retain a decision that appears in completion summaries while the item or related domain object did not reach the matching state. The service also does not reject completed check-ins or already-discussed items before creating another decision.

Required fix: make decision creation plus item state/decision linkage atomic, validate active check-in and item state before mutation, prevent or make idempotent duplicate decisions for a single item, and define how side-effect failures are handled without producing a persisted summary that claims more than was applied. Add tests that force each failure point.

### P2: Active check-in mutations fail silently in the UI and can be submitted repeatedly

`src/components/check-ins/check-in-flow.tsx:86`, `src/components/check-ins/check-in-flow.tsx:114`, and `src/components/check-ins/check-in-flow.tsx:171` await mutations without catch blocks, visible error state, focus movement, or pending-state disabled controls. Failed skip/defer/decision/complete requests leave keyboard and screen-reader users without an announced error, and rapid repeated clicks can submit duplicate decisions or completion requests.

Required fix: add per-action pending/error handling with `role="alert"` or equivalent announced errors, focus restoration/movement to the error or failed control, disabled pending controls, and tests proving user input is preserved on failed decision save.

## Test Coverage Gaps

- No test covers mismatched `responsibilityId` versus the current agenda item.
- No test covers partial failure between decision create, item discussed update, responsibility effect, and radar effect.
- No test covers decision attempts on completed check-ins or already-discussed items.
- No production e2e covers the real check-in component/API flow; the current check-in e2e is intentionally route-mocked.
