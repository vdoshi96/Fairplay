# Task

## Role

CODE QUALITY reviewer for implementation task T03 in `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`.

## Scope

Review T03 persistence-layer commits:

- `5d20d6d9b34022eb7da4da02bee5013394105d18`
- `f6f358bf2a7d2f703d3773d31f996f406a544452`

Ignore review artifact commits except as context. Do not modify production code.

## Checklist

- Prisma client initialization is lazy/build-safe and appropriate for Next/Vercel.
- Schema naming, indexes, relations, cascading behavior, and uniqueness are coherent.
- Migration SQL matches schema and is safe for initial deploy.
- Repository APIs are cohesive, typed, and do not leak Prisma internals unnecessarily.
- Cross-household/persona validation is implemented close enough to persistence boundaries to prevent future API mistakes.
- Transactions are used for multi-record writes that must be atomic.
- Seed script is idempotent and only seeds approved demo templates.
- Integration tests are meaningful, isolated, and can run repeatedly against a database.
- No plaintext passwords/session tokens, no secrets in docs/env, no scoring fields.
- Package scripts and compose file are sane.

## Required Verification

- `git status --short`
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm test -- --run src/server/repositories`
