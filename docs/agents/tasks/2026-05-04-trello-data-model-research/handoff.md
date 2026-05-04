# Handoff

## Current State

Trello structure research is complete. Findings are recorded as aggregate counts, paraphrased workflow patterns, and original product implications. No production code was changed, and no `References/` files were staged.

## Product Architect Handoff

- Treat the Trello reference as evidence for a responsibility-library model, not as source material for user-facing templates.
- Model status and ownership as first-class fields rather than relying on Kanban-style columns.
- Separate template responsibilities from household instances so users can customize, pause, archive, or mark items not relevant.
- Include lifecycle fields for noticing/deciding, planning/preparation, execution/follow-through, standards, cadence, blockers, and review dates.
- Support a radar/review state that lets households discuss a responsibility without immediately reassigning it.
- Support multiple category tags and hidden-effort dimensions because many responsibilities cross boundaries.
- Build load-balance signals as aggregate, non-punitive summaries rather than partner scores.

## IP/Safety Handoff

- Block exact or near-exact reuse of Trello card names, list names, label names, card descriptions, image assets, and description-section wording.
- Review any starter taxonomy for similarity to the Trello board and prior private references before implementation.
- Prefer generic household language and user-authored copy in MVP.
- Safety review should cover partner invites, shared radar items, check-ins, private drafts, and any imbalance summaries.

## Controller Next Steps

- Assign product architecture to synthesize these notes with the EPUB and idea-file research into an original v1 requirements/data-model document.
- Assign IP review before any responsibility library, default category system, check-in prompt set, or educational content is written.
- Assign safety/content review for relationship-support copy and household imbalance surfacing.
