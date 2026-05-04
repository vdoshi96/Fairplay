# Task

## Scope

Final T06 code-quality re-review after load-snapshot `AUTH_REQUIRED` fix commit `6896c44496c5731c8786abaa6a0e690cad501cc7`.

## Review Target

- Prior findings: `docs/agents/tasks/2026-05-04-review-t06-code-quality/handoff.md`
- Prior re-review findings: `docs/agents/tasks/2026-05-04-review-t06-code-quality-rereview/handoff.md`
- Fix commits:
  - `85108b11982c01276b1c5172e9c02e350c723295`
  - `6896c44496c5731c8786abaa6a0e690cad501cc7`

## Checklist

- Confirm `/api/load-snapshot` handles `AUTH_REQUIRED` and `selectedPersonaId: null` consistently with responsibility overview routes.
- Confirm generic responsibility PATCH cannot bypass status/assignment transition rules.
- Confirm private radar drafts do not leak in load overview.
- Confirm production component/API/service coverage is improved enough for T06 quality.
- Quick sweep for T06 quality, accessibility, security, and no-score/no-winner/no-loser language regressions.

## Required Verification

- `git status --short`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities src/app/api/load-snapshot`
- `npm run test:e2e -- --grep "responsibility|load map"`
- `npm run build`
