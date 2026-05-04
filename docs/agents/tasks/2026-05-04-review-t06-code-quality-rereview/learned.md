# Learned

- The T06 fix correctly moves transition-only fields out of the public generic update schema while leaving internal repository update support for dedicated status persistence.
- The editor no longer sends `status`, `currentAssignments`, or `visibility` in generic PATCH saves; assignments and visibility/status actions use dedicated endpoints.
- `responsibilityService.listOverview` now requires `selectedPersonaId` before linking radar items, which prevents cross-persona private radar draft leakage.
- Any other route that calls `listOverview` must now handle the service's `AUTH_REQUIRED` error, not only the primary `/api/responsibilities` route.
