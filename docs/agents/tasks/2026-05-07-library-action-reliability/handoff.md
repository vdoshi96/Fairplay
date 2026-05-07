# Library action reliability handoff

## Summary

Responsibility detail actions now either report visible success/failure or explain that detail-sheet card actions are unavailable when no action callbacks are wired. The created-card path also has direct exits back to Library and Load Map.

## Validation

- `npm test -- src/components/responsibilities/responsibility-editor.test.tsx src/components/cards/card-detail-sheet.test.tsx --run`
  - 2 files passed, 11 tests passed.
- `npm run typecheck`
  - Passed.
- `npm run lint`
  - Passed.
- `git diff --check`
  - Passed.

## Notes

- `Track for later` was not added because the production Library/detail flow did not currently expose that label.
