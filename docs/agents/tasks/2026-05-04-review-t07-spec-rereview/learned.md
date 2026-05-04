# Learned

- The prior board-refresh finding is resolved by applying successful mutation responses into `RadarBoard` local state and regrouping visible sections from that local state.
- The production board now covers create, publish, defer, resolve, dismiss, and schedule fetch-path updates in focused component tests instead of relying only on callback mocks or route-mocked Playwright HTML.
- `desiredTiming` is a nullable string field in summary/detail/create/update contracts and is persisted through Prisma, repository/service mapping, API payloads, UI create/edit/display controls, and tests.
- `deferredUntil` is a nullable ISO date-time in summary/detail/defer contracts and is persisted through Prisma, repository/service mapping, API payloads, UI revisit-date defer/display controls, and tests.
- Private radar draft isolation remains selected-persona scoped in service/repository list and access checks.
- The radar e2e flow remains intentionally route-mocked; the fix documents this and adds production component tests for the risky UI refresh behavior.
