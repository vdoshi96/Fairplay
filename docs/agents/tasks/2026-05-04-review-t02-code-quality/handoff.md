# Handoff

## Status

CHANGES_REQUESTED for T02 code quality after the visibility fix.

## Findings

- P1 blocking username boundary: `src/contracts/auth.ts:18` and `src/contracts/auth.ts:34` allow arbitrary trimmed usernames, while `src/domain/ids.ts:26` through `src/domain/ids.ts:31` can normalize valid contract input to an empty or unsafe storage/throttle key. Required fix: add a shared `HouseholdUsernameSchema` or equivalent that applies `normalizeHouseholdUsername`, then enforces a non-empty safe normalized username shape; use it in create-household and login request contracts; add tests for whitespace/hyphen collapse, all-hyphen rejection, unsafe punctuation rejection, and duplicate-equivalent normalization. Owner: T02 contract/domain owner before T03/T04.
- P1 blocking responsibility visibility boundary: `src/contracts/responsibilities.ts:64` through `src/contracts/responsibilities.ts:81` allows `private` in `ResponsibilityCreateSchema`, even though v1 reserves private drafts for radar unless product review explicitly adds private responsibility drafts. Required fix: default responsibility create visibility to `shared_household` and reject `private`, or add a separate explicitly reviewed private-responsibility draft contract. Add contract tests for omitted visibility defaulting to shared and private create rejection. Owner: T02 contract owner before T06, preferably before T03 maps database records to contracts.

## Quality Assessment

- Domain enum arrays, Zod enum schemas, and inferred types are readable, co-located, and stable for API/server/UI reuse.
- Visibility transition logic is simple and correct for the reviewed rule, and the responsibility/radar contracts both reuse the domain helper pattern after the fix.
- Load signal output is aggregate-only and free of hidden scoring fields or partner ranking semantics.
- Demo content is intentionally tiny, marked `approved_original`, versioned, and test-covered without introducing a larger source-like catalog.
- Safety copy is short, neutral, original, and does not overstate clinical, legal, financial, or crisis support.
- Tests cover enum stability, documented happy-path contracts, visibility confirmation boundaries, load-signal aggregate shape, and reviewed seed scope without snapshot files.
- Shared domain/contracts/seed modules do not import React, browser APIs, or Next runtime modules.
- Alias note: `@/*` works for TypeScript/Next but is not configured in Vitest; fix before/inside T03 if tests or server modules start relying on aliased imports.

## Verification

- `git status --short`: clean before review artifact edits.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/domain src/contracts src/seed`: passed, 9 test files and 20 tests.
- `npm run build`: passed with the existing edge-runtime static-generation warning.

## Next Owner Notes

- Apply the two required contract/domain fixes before starting dependent route-handler work. The username fix is especially important before T03 creates `usernameNormalized` uniqueness and T04 implements login throttling.
- Keep the dedicated visibility mutation path introduced by `3e3235e`; do not reintroduce generic responsibility or radar visibility updates.
