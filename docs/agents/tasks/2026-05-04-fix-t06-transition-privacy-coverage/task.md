# Task

## Scope

Fix T06 code-quality findings in the responsibility update, load overview radar linkage, and production test coverage surfaces.

## Requirements

- Keep generic responsibility PATCH/edit updates away from transition-only fields.
- Keep status and assignment transitions on their dedicated routes/services with confirmation, handoff, revisit context, and neutral events.
- Scope load overview radar linkage to a selected persona so private draft radar links remain visible only to their creator.
- Add production component/API/service coverage for editor submit shape, status archive confirmation, assignment handoff, and load-map filters/summaries.
- Do not touch auth internals, Prisma schema/migrations, radar UI pages, check-in files, or private reference files.

## Verification

- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`
- `npm run test:e2e -- --grep "responsibility|load map"`
- `npm run build`
- `git diff --check`
- `git status --short` before and after commit
