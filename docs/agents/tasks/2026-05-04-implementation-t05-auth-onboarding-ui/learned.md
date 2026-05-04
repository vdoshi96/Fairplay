# Learned

- T04 provides `/api/auth/me`, login/create/logout, persona selection, middleware protection, and current-session helpers. T05 can consume those without modifying auth internals.
- Browser-side Playwright route mocks do not intercept server-side middleware or route-handler fetches. For DB-unavailable e2e, protected app document transitions need browser document mocks, while the real UI for those protected screens is covered by component tests and build/typecheck.
- Next may encode the `next` search parameter differently during navigation; e2e assertions should allow both raw slash and `%2F` forms.
- Running `next build` at the same time as a Playwright dev server can corrupt `.next` collection with transient `PageNotFoundError`; run those checks sequentially.
