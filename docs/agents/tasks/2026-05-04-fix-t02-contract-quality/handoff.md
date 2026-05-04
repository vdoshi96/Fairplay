# Handoff

## Status

Verified locally; commit and push pending.

## Summary

- Added `HouseholdUsernameSchema` in `src/domain/ids.ts`.
- Updated username normalization to treat whitespace, underscores, and hyphens as separators, collapse repeated separators, lowercase, and trim leading/trailing hyphens.
- Auth create/login schemas now parse `username` to the normalized household username and reject unsafe normalized results.
- Responsibility creation now defaults omitted visibility to `shared_household` and rejects `private`, while allowing existing visible-space options.
- Added focused regression coverage for username normalization/rejection and private responsibility create rejection.
- Added a simple Vitest `@` alias mapping.

## Verification

- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/contracts src/domain`: passed, 8 test files and 22 tests.
- `npm run build`: passed with the existing edge-runtime static-generation warning.
- `git diff --check`: passed.
