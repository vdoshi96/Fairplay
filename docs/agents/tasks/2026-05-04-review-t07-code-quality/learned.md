# Learned

- The radar service correctly scopes list/detail access by household and selected persona, and private drafts are filtered to the creator persona in both service and Prisma-backed list paths.
- Linked responsibility and check-in ids are validated against the active household before create/update/schedule mutations.
- The timing migration is additive and nullable, and `desiredTiming`/`deferredUntil` now flow through contracts, Prisma schema, service mapping, API responses, and UI display.
- The route-mocked radar Playwright test is useful as a smoke test only; the component/API/service coverage carries most of the real implementation confidence.
- State transition quality is not yet centralized. Dedicated transition routes exist, but generic PATCH can still write `state` directly and dedicated mutations do not consistently clear incompatible transition metadata.
