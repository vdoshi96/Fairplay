# Gaps

No open spec compliance gaps remain for T04 after fix commit `aae2b9ee6c708409ec4be9f66e51b7a0147d9fd5`.

## Notes

- Build continues to print the existing Next.js warning: using edge runtime on a page currently disables static generation for that page. This warning did not affect the auth/session/persona spec result.
- Repository integration tests that require a live Postgres database were outside this T04 re-review command list and were not run.
