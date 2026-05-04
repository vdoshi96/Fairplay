# Gaps

## Blocking

- None.

## Non-Blocking Notes

- `npm run build` passes but repeats the existing Next.js warning that using edge runtime on a page disables static generation for that page.
- The Vitest alias configuration was verified by resolving the Vite config; there are not yet production test imports using `@/*`, so the first future aliased test import should still be allowed to prove the full path end to end in normal test execution.
