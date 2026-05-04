# Task

Re-review T08 guided check-in spec compliance after fix commit `cb22b7256302f5e49c143c229199b03c3720ceb4`.

## Scope

- Prior findings: `docs/agents/tasks/2026-05-04-review-t08-spec/handoff.md`.
- Original implementation commit: `1ad767a82e4f1c25f592ffad5bbac796f620d7fc`.
- Fix commit: `cb22b7256302f5e49c143c229199b03c3720ceb4`.

## Checklist

- Confirm item updates are scoped by check-in id, item id, and household, with a cross-household regression.
- Confirm agenda preview no longer creates or resumes active check-ins, and removed preview suggestions are respected when starting.
- Confirm guided UI exposes structured owner and review-date responsibility decision controls and sends a real `responsibilityEffect`.
- Sweep original T08 requirements: max 5 agenda, check-in/item states, skip/defer neutral treatment, explicit decisions, factual summary without score/clinical/grievance language, visibility labels, and cross-household rejection.

## Result

`CHANGES_REQUESTED`
