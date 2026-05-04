# Handoff

## Summary

T06 adds the responsibility service layer, aggregate load snapshot builder, JSON API routes, load map page, responsibility create/detail pages, mobile-first load map component, responsibility editor component, and focused tests.

## Review Focus

- Confirm household scoping for all reads/mutations remains anchored to `getCurrentSession`.
- Review the assignment mutation path for accountable-owner handoff/revisit enforcement and neutral `ResponsibilityEvent` payloads.
- Confirm archive requires explicit confirmation and pause/not-relevant/status copy stays neutral.
- Confirm load snapshot output contains aggregate fields only and no score/comparison language.
- Confirm route-mocked e2e coverage is acceptable while local DB is unavailable.

## Verification Notes

Early checks passed before final verification:

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`

Final local verification passed:

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`
- `npm run test:e2e -- --grep "responsibility|load map"`
- `npm run build`
- `git diff --check`

The e2e responsibility flow is route-mocked because DB-backed protected app flows remain unavailable in this environment.
