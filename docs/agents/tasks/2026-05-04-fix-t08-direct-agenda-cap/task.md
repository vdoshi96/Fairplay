# T08 Direct Agenda Cap Fix

Focused T08 direct-service agenda cap fix worker for guided check-ins.

## Scope

- Fix the direct service negative `maxItems` edge case in check-in agenda generation.
- Ensure effective agenda limits are normalized to the inclusive range `1..MAX_AGENDA_ITEMS`.
- Add regression coverage proving direct service create and preview calls with negative `maxItems` cannot produce more than five agenda items.

## Owned Files

- `src/server/check-ins/agenda.ts`
- `src/server/check-ins/service.test.ts`
- `docs/agents/tasks/2026-05-04-fix-t08-direct-agenda-cap/`
- `docs/agents/manifest.md`
- `docs/agents/controller-log.md`
