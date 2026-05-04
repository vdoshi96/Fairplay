# T07 Radar Transition, Modal, and Mutation Error Fix

## Scope

Fix only the T07 code-quality findings from `docs/agents/tasks/2026-05-04-review-t07-code-quality/handoff.md`.

## Required Outcomes

- Remove transition-only state mutation from generic radar PATCH.
- Add a dedicated dismiss transition.
- Clear stale transition metadata consistently across publish, defer, resolve, schedule, and dismiss.
- Preserve board form/dialog/edit state and show visible errors on failed mutations.
- Make publish confirmation a keyboard-modal dialog while preserving private draft confirmation and neutral wording.

## Owned Files

- `src/contracts/radar.ts` and tests
- `src/server/radar/service.ts` and tests
- `src/app/api/radar/**`
- `src/components/radar/**`
- `e2e/radar.spec.ts` if needed
- Task docs, `docs/agents/manifest.md`, and `docs/agents/controller-log.md`

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/radar src/components/radar src/app/api/radar src/contracts/radar`
- `npm run test:e2e -- --grep "radar"`
- `npm run build`
- `git diff --check`
- `git status --short` before and after commit
