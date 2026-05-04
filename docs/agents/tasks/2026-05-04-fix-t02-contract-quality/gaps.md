# Gaps

## Blocking

- None identified in the owned T02 contract-quality scope after implementation.

## Notes

- T03 should store and query the normalized `username` returned by `CreateHouseholdRequestSchema` and `LoginRequestSchema`; route handlers should not reimplement username normalization.
- T04 throttling should key on the same parsed normalized username.
- Responsibility private drafts remain reserved for radar contracts unless a later product review introduces a separate responsibility draft flow.
