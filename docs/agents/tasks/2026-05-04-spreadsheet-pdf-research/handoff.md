# Handoff

## Current State

Spreadsheet and PDF structure research is complete. Findings are recorded as aggregate counts, paraphrased patterns, original model implications, and IP risks. No production code was changed, and no `References/` files were staged.

## Product Architect Handoff

- Treat the workbook as evidence for an inventory-and-assignment workflow, not as source material for product copy.
- Separate template metadata from household-specific responsibility instances.
- Make owner, role, cadence, relevant days, status, household standard, concern state, and review dates first-class fields.
- Include a way to mark responsibilities as paused, not relevant, or archived so reducing scope is visible without deleting history.
- Build check-ins around unresolved concerns, due-for-review responsibilities, recent changes, and calm decision summaries.
- Store equity snapshots as aggregate period summaries: owner distribution, shared load, high-frequency load, category mix, paused/not-relevant counts, and open concerns.
- Use original category names, original responsibility examples, and original visual language only after IP review.

## IP/Safety Handoff

- Block exact or near-exact reuse of worksheet wording, card names, card descriptions, PDF card text, source category names, formulas as branded scoring, and visual deck/card assets.
- Block a full source-like starter deck or printable-card UI until legal/IP review explicitly clears the approach.
- Prefer user-authored custom responsibilities and a small set of invented demo records for MVP.
- Safety review should cover private drafts, partner-visible concern flags, check-in prompts, imbalance summaries, and any wording that could escalate conflict.

## Controller Next Steps

- Assign product architecture to synthesize workbook/PDF findings with EPUB, idea-file, and Trello research into original v1 requirements.
- Assign IP review before any responsibility library, category taxonomy, onboarding worksheet, check-in prompt set, demo data, or visual card UI enters specs or code.
- Assign safety/content review for concern states, partner invites, shared review flows, and equity snapshot presentation.
