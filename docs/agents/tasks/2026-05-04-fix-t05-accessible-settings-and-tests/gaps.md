# Gaps

- DB-backed protected-route verification remains out of scope for this focused frontend fix because local Postgres availability is not guaranteed in the T05 verification path.
- The auth/onboarding Playwright flow still uses API and protected-route handoff mocks to remain runnable without local Postgres; it must be treated as mocked auth-flow verification, not database-backed protected UI verification.
