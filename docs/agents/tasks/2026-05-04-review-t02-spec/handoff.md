# Handoff

## Status

CHANGES_REQUESTED.

## Required Fix

Owner: T02 implementation worker.

Update the responsibility visibility contract so private-to-shared visibility changes cannot be accepted without explicit confirmation. Acceptable fixes include removing direct `visibility` changes from `ResponsibilityUpdateSchema` and adding a dedicated responsibility visibility mutation with `fromVisibility`, target `visibility`, and a confirmation flag, or adding equivalent transition context and `superRefine` enforcement to the update schema.

Add or update tests proving `private` to `shared_household`, `partner_visible`, and `check_in_only` responsibility transitions fail without confirmation and pass with confirmation.

## Verified Passing

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/domain src/contracts src/seed`
- `npm run build`

## Review Summary

Approved portions: exact enums, Zod contracts broadly covering the planned surfaces, deterministic username normalization, radar publish confirmation, aggregate-only load signals, tiny reviewed seed content, neutral original safety copy, and required T02 implementation artifacts.

Blocking issue: responsibility update visibility bypass at `src/contracts/responsibilities.ts`.
