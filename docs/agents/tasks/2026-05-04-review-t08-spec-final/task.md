# Task

Final spec compliance review for T08 guided check-ins after agenda cap fix commit `0f6fd575e7c03c0a16ccea2ff689d097c367801f`.

## Scope

- Re-review prior findings in `docs/agents/tasks/2026-05-04-review-t08-spec/handoff.md`.
- Re-review prior findings in `docs/agents/tasks/2026-05-04-review-t08-spec-rereview/handoff.md`.
- Inspect fix commits `cb22b7256302f5e49c143c229199b03c3720ceb4` and `0f6fd575e7c03c0a16ccea2ff689d097c367801f`.
- Do not modify production code.

## Checklist

- Confirm max agenda cap cannot exceed 5 through service/create/preview route paths.
- Confirm scoped item updates remain resolved.
- Confirm non-mutating preview remains resolved.
- Confirm removed suggestions are respected when starting.
- Confirm structured owner/review-date decision effects remain resolved.
- Sweep original T08 requirements: states, skip/defer neutral treatment, explicit decisions, factual summaries without score/clinical/grievance language, visibility labels, and cross-household rejection.

## Result

`CHANGES_REQUESTED`

The create and preview routes now reject `maxItems` above five, and the agenda builder clamps above-five direct service values. One service-boundary edge still violates the absolute five-item cap: a negative direct `maxItems` value can produce more than five items because it reaches `slice(0, maxItems)` as a negative end index.
