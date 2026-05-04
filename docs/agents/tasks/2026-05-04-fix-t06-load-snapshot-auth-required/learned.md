# Learned

- `responsibilityService.listOverview` now requires a selected persona because overview radar linkage is persona-scoped.
- Routes that call `listOverview` must translate `AUTH_REQUIRED`; otherwise authenticated users without an active persona can see an unhandled route failure.
- `/api/responsibilities` is the local response contract reference for this condition.
