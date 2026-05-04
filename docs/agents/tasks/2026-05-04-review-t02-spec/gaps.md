# Gaps

## Blocking

- `src/contracts/responsibilities.ts` allows `ResponsibilityUpdateSchema` to accept `visibility` directly with no `fromVisibility` and no explicit confirmation flag. The global T02/spec rule requires explicit confirmation for private-to-shared, private-to-partner-visible, and private-to-check-in-only transitions.

## Non-Blocking Notes

- `npm run build` passes but repeats the existing Next.js warning that using edge runtime on a page disables static generation for that page.
- This review did not inspect private `References/` materials and found no evidence T02 production code consulted or copied them.
