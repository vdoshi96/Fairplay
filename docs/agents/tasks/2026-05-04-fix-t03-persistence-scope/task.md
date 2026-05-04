# Task

Fix the T03 spec-review persistence findings without touching unrelated app, auth, or domain contract files.

## Scope

- Add a source-controlled initial Prisma migration.
- Make `ResponsibilityTemplate.id` a generated UUID and keep stable seed lookup through the unique slug.
- Tighten repository methods so reads and writes are household scoped and private radar drafts are selected-persona scoped.
- Add repository integration coverage for cross-household rejection cases.
- Preserve the existing no-score/no-winner/no-loser/no-grade data model direction.

## Verification

- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test -- --run src/server/repositories`
- `git diff --check`
- `git status --short` before and after commit
