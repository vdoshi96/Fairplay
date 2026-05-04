# Gaps

- The auth/onboarding Playwright tests still hand off `/app/onboarding` and `/app/home` to mocked HTML because DB-backed e2e is not available in this environment. This is non-blocking for this re-review because component/page coverage now exercises the real protected UI.
- No full browser accessibility audit was run for the settings dialog; coverage is via Testing Library focus/role assertions plus static review.
- `npm run build` still emits the existing non-blocking Next.js edge-runtime static-generation warning.
