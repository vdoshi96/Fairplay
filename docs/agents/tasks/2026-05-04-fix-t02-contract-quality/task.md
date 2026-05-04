# Task

## Scope

Fix the T02 code-quality findings in the v1 shared domain/contracts worktree.

## Required Fixes

- Add a shared household username schema that normalizes raw username input to a safe identity key and rejects unsafe normalized output.
- Use the shared household username schema in create-household and login request contracts so handlers receive normalized usernames.
- Tighten responsibility creation so private visibility is rejected and omitted visibility defaults to `shared_household`.
- Add focused tests for username normalization/rejection and private responsibility create rejection while preserving existing visibility mutation tests.
- Add Vitest `@/*` alias support if simple and safe.

## Owned Files

- `src/domain/ids.ts`
- `src/domain/ids.test.ts`
- `src/contracts/auth.ts`
- `src/contracts/auth.test.ts`
- `src/contracts/responsibilities.ts`
- `src/contracts/responsibilities.test.ts`
- `vitest.config.ts`
- `docs/agents/**`

## Out of Scope

- `src/app/**`
- `src/server/**`
- `prisma/**`
- Other feature code
- Private reference files
