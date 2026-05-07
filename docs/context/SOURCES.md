# Fairplay Sources

Last updated: 2026-05-07

## Source Policy

- `References/` contains private local materials and is ignored by git.
- This indexing pass did not open or inspect files under `References/`.
- Future work should use cleared/paraphrased repo docs unless the user explicitly approves a specific source review.
- Do not copy book text, workbook labels, card/deck wording, public app UI, proprietary taxonomies, source visuals, or private exports into production code, tests, fixtures, screenshots, docs, or prompts.

## Repo Sources Consulted In This Pass

- `README.md`: setup, environment, commands, deployment, and reference-material policy.
- `package.json`: scripts, dependencies, and Node engine.
- `.gitignore`: confirms ignored env files, local worktrees, generated output, test artifacts, `.DS_Store`, and `References/`.
- `docs/product/v1-scope.md`: product intent, route scope, stack direction, non-goals, and success criteria.
- `docs/product/data-model.md`: conceptual data model and platform-neutral contract direction.
- `docs/product/user-flows.md`: primary household, auth, onboarding, load map, responsibility, check-in, and settings flows.
- `docs/product/ip-safety-review.md`: IP, privacy, and relationship-safety constraints.
- `docs/product/visual-system.md`: visual tokens, character rules, motion guidance, and asset guardrails.
- `docs/deployment/local-development.md`: local database, Prisma, and verification workflow.
- `docs/deployment/release-checklist.md`: historical release blocker and verification evidence.
- `docs/helper-system/README.md`: Little Alex architecture and verification surface.
- `docs/agents/manifest.md`: task history and agent operating rules.
- Latest 2026-05-07 task handoffs and QA notes under `docs/agents/tasks/`.
- `prisma/schema.prisma` and migrations list.
- `src/app`, `src/components`, `src/contracts`, `src/domain`, `src/server`, `src/seed`, and `e2e` file inventories.

## External/Private Sources Already Reflected In Repo Docs

- Paraphrased research reports exist in `docs/research/`.
- Extensive agent task notes under `docs/agents/tasks/` reference private sources and prior research only at a paraphrased/process level.
- Treat those repo docs as provenance, not permission to copy from the original private materials.

## Needs Verification

- Whether any remaining `source*` field names, `fairplay-source-cards`, or card-library wording should be renamed to reduce confusion with private-source policy.
- Whether deprecated AI media fields and endpoints are still needed for migration/backward compatibility.
