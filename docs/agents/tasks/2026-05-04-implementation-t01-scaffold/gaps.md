# Gaps

- `npm audit --omit=dev` reports two moderate advisories through `next`'s transitive `postcss`; npm recommends a breaking downgrade via `npm audit fix --force`, so no automatic fix was applied in T01.
- Vitest currently has no unit tests beyond setup because T01's runnable behavior is covered by the minimal Playwright smoke test.
- Auth routes are not implemented yet, so `/login` and `/create-household` are prepared as links only.
- Service worker and offline caching remain intentionally absent.
