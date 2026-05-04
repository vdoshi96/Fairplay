# Learned

- `responsibilityService.listOverview` is now a selected-persona-scoped operation because linked radar data can include private drafts.
- `/api/load-snapshot` now mirrors `/api/responsibilities` for selected-persona-required failures by mapping service `AUTH_REQUIRED` to HTTP 401.
- Keeping transition-only responsibility fields out of the generic update schema gives the API a clear boundary: generic edits update descriptive fields, while status, assignment, and visibility changes use dedicated routes.
- Focused API/component/service tests now cover the previously risky T06 paths well enough for this final code-quality review, while live DB-backed browser verification remains outside the available local setup.
