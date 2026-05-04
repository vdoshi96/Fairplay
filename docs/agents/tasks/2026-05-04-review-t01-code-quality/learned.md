# Learned

- The scaffold uses current Next App Router patterns with flat ESLint config, strict TypeScript, Tailwind token mapping, Vitest, and Playwright.
- The `@/*` alias resolves under the current TypeScript/Next configuration; `npm run typecheck` passed.
- The root page remains server-rendered and contains no browser storage, cookie manipulation, session handling, or auth implementation beyond links to future routes.
- PWA metadata is intentionally lightweight: `manifest.ts` is static, while generated icon routes use `ImageResponse` and build as dynamic edge endpoints.
- The visual token set is multi-accent and not a one-note palette. Root layout sizing uses stable minimum heights, flex/grid constraints, and accessible link targets.
- Vitest is configured to pass with no tests because T01 has no unit-testable domain behavior yet; Playwright covers the root smoke path.
- `npm audit --omit=dev` currently reports a moderate advisory through Next's bundled PostCSS. The suggested force fix is unsafe because it would downgrade Next to 9.3.3.
