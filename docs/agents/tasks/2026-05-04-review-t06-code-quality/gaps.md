# Gaps

## Changes Requested

- The generic responsibility edit path accepts transition fields (`status`, `currentAssignments`) that should be handled only by dedicated mutation paths. This bypasses archive confirmation, handoff requirements, and responsibility event recording.
- The responsibility overview/load map reads all household radar rows and exposes linked private radar drafts across personas through `linkedRadarItems` and the radar filter.

## Non-Blocking Notes

- The responsibility e2e test remains route-mocked and does not provide DB-backed protected app verification. It is documented as mocked, but its handcrafted HTML includes behavior not guaranteed by the production component.
- The editor has accessible labels and an archive confirmation affordance, but save/status/radar actions remain fire-and-forget with no visible pending, success, or error state. This increases user confusion when API calls fail.
- No sensitive browser storage usage, source-derived copy, clinical/diagnostic language, score/grade/winner/loser language, or blame wording was found in the reviewed T06 production surface.

