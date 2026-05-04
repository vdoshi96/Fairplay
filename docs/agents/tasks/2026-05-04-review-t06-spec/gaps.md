# Gaps

## Changes Requested

- Existing responsibility edit is not spec-compliant: the editor sends `visibility` in PATCH payloads, while the strict update schema omits `visibility`, so normal edit saves return `400` before field updates are applied.
- The responsibility editor does not expose all v1 edit fields required by T06. In particular, it lacks relevant-days controls and a visibility control/path for non-private responsibility visibility changes.
- The load map radar filter is not backed by real linked radar data. The page never passes flagged responsibility ids to the component, and the service only selects radar `id` and `state` for aggregate counts.
- The load map summary omits required area mix and hidden effort mix signals, even though those aggregate fields are present in the snapshot contract.

## Non-Blocking Notes

- Radar flagging through the API creates linked radar items with explicit confirmation for non-private publishing; the editor currently only creates private flags, and the full radar UI remains T07 scope.
- No source-derived category/copy, clinical/therapy claims, or deck/card metaphor issues were found in the reviewed T06 surface.
- Route-mocked e2e is documented as not DB-backed in the T06 implementation handoff/gaps.
