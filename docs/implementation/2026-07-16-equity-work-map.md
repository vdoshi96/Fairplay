# Equity Work Map And Ownership Agreements

## Scope

This milestone makes equitable planning visible and actionable without scoring, ranking, or automatically assigning either partner.

## Product behavior

- Board shows a compact household work map; Deal keeps the same context in a collapsed reference panel.
- Persona totals include only active and needs-review responsibilities and describe owned, shared-owned, daily/weekly, due-review, and hidden-effort-category counts.
- Household totals describe shared, unassigned, paused, not-applicable, and due-review work.
- Genuine shared ownership is derived into a Shared Board section and remains visible in both owners' decks. Persisted lane values are unchanged.
- Responsibility details expose accountable/shared owner, helper, backup, standard, review date, conception, planning, execution, and hidden-effort context.
- Existing-owner changes require an explicit replace-or-retain-as-helper handoff. The complete agreement, review date, events, and compatible board placement update in one transaction.
- Ownership writes carry the responsibility revision and compare it under a row lock, preventing stale owner, helper, backup, scope, or review-date overwrites.
- Check-ins include a read-only Worth reviewing list with due-card links and optional next-check-in scheduling.

## Compatibility and safety

- `CardBucket` and persisted-lane mappings live in platform-neutral domain code with compatibility exports from the prior UI module.
- No database lane enum was renamed and no destructive responsibility migration was introduced.
- The fast Deal distribution contract remains available for ownerless cards. Assigned/collaborative cards route through ownership details; same-owner placement repairs preserve collaborators.
- Equity language remains descriptive and non-clinical. There are no fairness percentages, partner scores, winner/loser labels, or automatic owner recommendations.
- AI provider keys and live generation were not used.

## Verification

- Prisma schema validation and client generation.
- ESLint and TypeScript checks.
- Full Vitest suite, including transaction rollback, concurrent distribution, stale same-owner agreement writes, work-map filtering, shared-deck visibility, and handoff resynchronization.
- Production Next.js build.
- Playwright auth, Deal, Board, Check-in, responsive, dark-mode, and Little Alex regression coverage.
