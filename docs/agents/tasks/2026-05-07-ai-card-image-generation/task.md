# AI Card Image Generation Task

## Scope

Fix AI-created Library cards so a successful draft includes both generated structured text fields and a generated card cover image.

## Updated Requirement

The cover image should target the current Fairplay Library card asset style from `public/assets/fairplay/cards/`, not the older reference PDF. The reference assets are local in-app Library assets produced from the Trello import and use a 5:7 portrait format.

## Out of Scope

- Rebuilding the full Library catalog.
- Changing the accepted responsibility data model beyond carrying the generated draft cover path into the accepted responsibility.
- Adding user image or audio inputs back into the AI draft flow.

## Cross-References

- Supersedes the text-only decision in `docs/agents/tasks/2026-05-07-text-only-card-generation/architecture-decision.md`.
- Implementation details live in `docs/implementation/2026-05-05-ai-task-manager.md`.
- Environment setup lives in `docs/deployment/local-development.md`.
