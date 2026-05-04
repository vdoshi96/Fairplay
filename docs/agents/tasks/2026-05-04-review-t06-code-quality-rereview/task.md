# Task

## Scope

Re-review T06 code quality after fix commit `85108b11982c01276b1c5172e9c02e350c723295`.

## Review Target

- Prior findings: `docs/agents/tasks/2026-05-04-review-t06-code-quality/handoff.md`
- Fix commit: `85108b11982c01276b1c5172e9c02e350c723295`

## Checklist

- Confirm generic PATCH no longer bypasses status/assignment transition rules, and tests prove status/archive/pause/not_relevant/active/assignment changes cannot happen through generic PATCH.
- Confirm dedicated status/assignment routes still enforce confirmation/handoff/revisit and events.
- Confirm load overview radar linkage filters private drafts by selected persona and tests prove no Alex/Max cross-private leakage.
- Confirm production component/API coverage improved enough to compensate for route-mocked e2e.
- Quick sweep no regressions: household scoping, no score language, stable UI state, tests meaningful.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`
- `npm run test:e2e -- --grep "responsibility|load map"`
- `npm run build`
