# Gaps

## Source and Parsing Gaps

- The local file named as JSON is an HTML page, so this task used transient public JSON data from the board link in the markdown reference.
- The exported snapshot has all cards in the reserve/library lane, so active workflow behavior is inferred from empty lane structure rather than observed usage history.
- The board has no custom fields, due dates, checklists, card members, or comments, so any richer lifecycle model must come from product design rather than Trello metadata.
- Trello activity history was not analyzed beyond high-level timestamps; user behavior patterns should not be inferred from this reference alone.

## Product Architecture Questions

- Decide whether v1 ships with any starter responsibility library or starts with user-authored responsibilities only.
- Decide whether child-specific load is a category, a tag, a responsibility subtype, or a household/member relationship feature.
- Decide how much of the lifecycle should be structured fields versus lightweight prompts and notes.
- Decide whether personal wellbeing and relationship-maintenance responsibilities belong in MVP or a later, safety-reviewed release.
- Decide how visible load-balance signals should be before both partners have opted into a shared household.
- Decide whether responsibilities can be split into sub-responsibilities, or whether v1 only supports shared ownership roles.

## IP and Safety Risks

- Do not copy source card titles, descriptions, labels, list names, images, or the repeated description-section wording.
- Avoid shipping a 100-card deck, a literal card-board workflow, or a category set that maps closely to the reference.
- Starter templates, category names, prompt phrasing, and check-in questions require IP review before entering product specs, code, tests, or fixtures.
- Conversation prompts should be safety-reviewed so the product does not encourage confrontation in unsafe household contexts.
