# Gaps

## Blocking

- P1: `src/contracts/auth.ts:18` and `src/contracts/auth.ts:34` accept any trimmed non-empty username, while `src/domain/ids.ts:26` through `src/domain/ids.ts:31` can normalize accepted inputs such as only hyphens to an empty string and leaves punctuation such as `/`, `@`, and other non-slug characters intact. Because T03 stores `usernameNormalized` uniquely and T04 throttles by normalized username, the contract should define a shared household username schema that normalizes, then rejects empty or unsafe normalized values. Owner: T02 contract/domain owner before T03/T04 consume username contracts.
- P1: `src/contracts/responsibilities.ts:64` through `src/contracts/responsibilities.ts:81` makes responsibility creation accept `visibility: VisibilitySchema`, including `private`. The v1 implementation plan says responsibilities should default to `shared_household` and private responsibility visibility should be rejected unless product review explicitly adds private responsibility drafts. Tighten `ResponsibilityCreateSchema` so route handlers and future iOS clients cannot create private responsibility records through the shared contract. Owner: T02 contract owner before T06, preferably before T03 maps persistence to these contracts.

## Non-Blocking Notes

- `vitest.config.ts` does not configure the `@/*` path alias from `tsconfig.json`. T02 avoided the issue with relative imports. Fix before/inside T03 if repository or contract tests will use aliased imports; otherwise explicitly keep server/domain tests on relative imports.
- `npm run build` passes but repeats the existing Next.js warning that using edge runtime on a page disables static generation for that page.
