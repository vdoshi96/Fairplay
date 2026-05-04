# Gaps

## Product Architecture Questions

- Decide whether v1 is primarily for romantic couples, couples with children,
  or broader shared households.
- Decide whether the Load Map should use original templates, user-created
  responsibilities only, or a hybrid with IP-reviewed starter examples.
- Define the minimum viable difference between assessment results, a household
  responsibility map, and a task manager.
- Decide how much partner comparison to show before both partners have
  completed their own assessment.
- Define how check-in history should summarize commitments without becoming a
  grievance archive.
- Decide whether short experiments belong in v1 or should wait until the core
  Load Map, Radar, and Check-In flows prove useful.
- Decide whether AI phrasing help is in MVP; if yes, constrain it to
  non-clinical language rewriting and clear safety boundaries.

## Safety and Trust Risks

- Users may use results as proof that a partner is failing. Product language
  needs to steer toward shared problem solving.
- Relationship prompts can escalate conflict in unsafe or coercive
  relationships. Onboarding, terms, and in-flow guidance need clear boundaries.
- Private drafts and shared household spaces are easy to confuse. The product
  needs persistent visibility labels and confirmation before sharing.
- A partner invite can feel accusatory. The invite flow should emphasize
  clarity, teamwork, and optional participation rather than judgment.
- Metrics can become manipulative if they imply a "bad partner" score.
- Sexual relationship content from the book is out of scope for v1 unless
  separately reviewed; the current app should stay focused on household
  organization and relationship support.

## IP Review Risks

- Responsibility templates, assessment questions, check-in prompts,
  experiments, scripts, education modules, and category names need review for
  similarity to Better Share and other private references.
- Avoid source-derived frameworks even when renamed if the structure remains
  substantially similar.
- Public-product inspiration from `idea.md` should be translated into original
  IA and copy before design or implementation.
- Future docs should cite this research as inspiration only and should not
  import private reference text into specs, tests, fixtures, or seed data.
