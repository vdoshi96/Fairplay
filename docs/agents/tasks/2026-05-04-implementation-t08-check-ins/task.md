# T08 Guided Check-Ins, Decisions, And Persisted Summaries

## Assignment

Implement guided check-ins for Fairplay v1 on `codex/v1-app`.

## Scope

- Create check-in agenda, service, and summary server modules.
- Add check-in API routes for create/resume, get, item state updates, explicit decisions, and completion.
- Add mobile-first check-in pages and components.
- Add service, API, component, and mocked e2e coverage.
- Preserve safety copy constraints: neutral summaries, no scoring, no diagnosis, skip/defer as normal outcomes.

## Ownership Note

T08 primarily owns `src/server/check-ins/**`, `src/app/api/check-ins/**`, `src/app/app/check-ins/**`, `src/components/check-ins/**`, e2e check-in tests, and task docs. A minimal `src/app/app/home/page.tsx` integration edit was required because adding the check-in route made the existing home link trip Next.js internal-link lint.
