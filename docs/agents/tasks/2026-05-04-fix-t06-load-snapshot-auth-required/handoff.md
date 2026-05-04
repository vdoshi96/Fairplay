# Handoff

## Summary

`/api/load-snapshot` now handles `AUTH_REQUIRED` from the responsibility service consistently with `/api/responsibilities`.

## Changed

- Added route coverage for authenticated sessions with no selected persona.
- Added a small service error mapper in the load-snapshot route for `AUTH_REQUIRED`.

## Next

- Re-review the focused T06 code-quality finding after verification and commit.
