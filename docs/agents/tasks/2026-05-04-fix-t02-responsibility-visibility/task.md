# Task: Fix T02 Responsibility Visibility Confirmation

## Scope

Fix the T02 spec-review finding that `ResponsibilityUpdateSchema` accepted direct `visibility` updates, allowing private responsibility content to move into shared or partner-visible spaces without explicit confirmation.

## Inputs

- T02 implementation commit: `b8dfb242ecfdaea2ce6a210f23f1131175655307`
- T02 spec review artifact commit: `9756a86ade4ebd6d147a1cba837ff33733357dab`
- Review finding: responsibility visibility updates must use the shared private-to-visible confirmation rule.

## Owned Files

- `src/contracts/responsibilities.ts`
- `src/contracts/responsibilities.test.ts`
- `docs/agents/manifest.md`
- `docs/agents/controller-log.md`
- `docs/agents/tasks/2026-05-04-fix-t02-responsibility-visibility/`

## Required Outcome

- Remove direct `visibility` acceptance from the general responsibility update schema.
- Add a dedicated visibility mutation contract with `responsibilityId`, `fromVisibility`, `toVisibility`, `confirmedVisibilityChange`, and optional `confirmationText`.
- Validate private-to-visible transitions with the shared visibility transition helper.
- Add regression coverage for private-to-`shared_household`, private-to-`partner_visible`, and private-to-`check_in_only` transitions.
