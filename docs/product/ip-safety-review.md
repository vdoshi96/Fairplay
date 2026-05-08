# IP, Privacy, and Relationship-Safety Review

## Current Position

Private reference materials exist locally in `References/` and are excluded from git. Product planning may use only the prior paraphrased research artifacts in `docs/agents/tasks/` unless a specific spot-check is approved and logged.

This document is an internal product-risk guide, not a legal opinion. Future agents must treat it as a blocking checklist before design or implementation work that touches user-facing content, data, privacy, or relationship-support flows.

## Product Scope Boundary

Fairplay is a household organization and relationship-support app. It helps a household clarify responsibilities, ownership, hidden coordination work, review timing, and practical follow-through.

Fairplay is not:

- Therapy, counseling, diagnosis, crisis support, or mental-health treatment.
- Legal, medical, financial, or abuse-intervention advice.
- A scoring system for proving that one partner is wrong or deficient.
- An official or affiliated implementation of any book, workbook, course, public app, card deck, or proprietary method referenced during research.

## IP Constraints

### Allowed

- Broad ideas that are not source-specific: making invisible household work visible, separating ownership from helping, recurring check-ins, handoff context, household standards in users' own words, private drafts, aggregate load summaries, and opt-in review.
- Original product models that transform the research into generic household entities such as households, members/personas, responsibilities, assignments, concerns, check-ins, decisions, and history events.
- Original UI language, original category names, original prompts, original examples, and user-authored household records.
- A small amount of invented demo data after review, as long as it does not mirror source card names, source category distribution, source examples, or a source-like catalog.

### Blocked Without Explicit Legal/IP Review

- Book prose, chapter structure, source examples, assessment text, scripts, exercises, quizzes, prompts, glossary wording, or distinctive terminology.
- Better Share public app UI labels, navigation, tab names, board buckets, assessment wording, paywall framing, or visible copy.
- Trello card names, list names, label names, card descriptions, repeated description-section wording, PNG/card assets, or board appearance.
- Workbook headings, dropdown labels, formulas as user-facing scoring, matrix wording, category names, responsibility rows, or household-standard text.
- PDF card text, printable-card layout, card dimensions, typography, visual density, iconography, colors, or deck/print-sheet metaphor.
- A full starter library that substantially resembles a 100/101-item deck, workbook, or board, even if individual titles are rewritten.
- Any feature that recreates a source framework by renaming parts while preserving the distinctive sequence, taxonomy, prompt structure, or assessment pattern.

### Preferred V1 Approach

- Start with user-authored responsibilities and a few reviewed invented examples rather than a full starter template library.
- If templates are needed, make them fewer, broader, independently named, and reviewed against all prior research artifacts before they enter specs, code, tests, fixtures, seed data, or screenshots.
- Use neutral product vocabulary for categories and statuses. Avoid branded or source-adjacent labels in user-facing surfaces.
- Avoid a literal deck, card-game, printable-card, or source-board interaction model. Compact responsibility objects are acceptable when visually original.

## Privacy Constraints

### Household Login Model

V1 may use simple household authentication:

- One household username.
- One household password.
- Two household personas selected after login.
- No email address, email delivery, magic link, or external identity provider required for v1.

This model is intentionally low-friction, but it is not strong per-person identity. Product copy and permissions must not imply that one persona's records are secret from someone who knows the shared household password.

### Password and Session Requirements

Implementation must meet these minimum requirements:

- Store passwords only as slow password hashes using Argon2id, bcrypt, or scrypt with current production parameters.
- Never log, store, expose, seed, or test with real household passwords in plaintext.
- Use server-managed sessions with opaque session identifiers or signed/encrypted session references.
- Send session cookies as `HttpOnly`, `Secure`, and `SameSite=Lax`.
- Provide logout that invalidates the active session.
- Use idle and absolute session expiration; exact durations should be chosen during implementation and documented.
- Add basic rate limiting or lockout protection for repeated failed login attempts before public launch.

### Client Storage Requirements

- Do not store household data, private drafts, sensitive notes, concern details, or session secrets in `localStorage`.
- Avoid long-lived `sessionStorage` for sensitive records. Use it only for non-sensitive UI state when needed.
- If drafts need persistence, store them server-side with explicit visibility and ownership metadata, or keep them transient until the user saves.
- Treat browser autofill, shared devices, screenshots, and back-button history as real privacy risks in design.

### Vercel-Compatible Persistence

- Store household records in a managed database suitable for Vercel deployments.
- Keep session state server-side or in signed/encrypted cookies that do not expose sensitive contents.
- Model visibility on sensitive records explicitly: private draft, shared household record, partner-visible item, and bring-to-check-in item.
- Keep audit/history useful for trust without turning it into a blame ledger.

## Relationship-Safety Constraints

### Non-Clinical Boundary

- Do not diagnose users, partners, attachment styles, abuse, mental-health conditions, or relationship health.
- Do not provide therapeutic protocols, clinical treatment plans, or crisis counseling.
- Use practical household language: clarify, pause, revisit, adjust, ask for support, define the next step.
- Include appropriate non-clinical disclaimers in onboarding/help surfaces before public launch.

### Unsafe Relationship Boundary

The app must not encourage confrontation when a user may be in an unsafe, coercive, violent, surveilled, or retaliatory relationship.

Future safety copy should support patterns such as:

- A clear statement that the app is for relatively safe household planning conversations.
- A reminder not to use shared notes or invites if doing so could put the user at risk.
- A fast way to leave sensitive screens.
- Conservative notification behavior for partner-visible changes.
- Guidance to seek trusted local or professional support when safety is a concern, without pretending the app can assess danger.

### Non-Punitive Interaction Rules

- Do not generate a "bad partner" score, morality grade, blame ledger, or shareable proof of failure.
- Do not rank partners as winners/losers or diagnose intent from task patterns.
- Present differences as areas to clarify, rebalance, pause, or revisit.
- Summaries should focus on responsibilities, capacity, blockers, agreements, and next review dates.
- Concern boards must avoid loaded labels that imply defect, laziness, neglect, or bad faith.

## Product and UX Guardrails

- Use calm wording and restrained visual emphasis for imbalance, urgency, and concern states.
- Keep private drafts visually distinct from shared records at all times.
- Require confirmation before publishing a private note to a partner-visible or shared household space.
- Let users save, edit, archive, pause, and mark responsibilities not relevant without framing scope reduction as failure.
- Make check-ins short, opt-in, and skippable. Users should be able to pause a tense topic and keep private notes private.
- Include appreciation or acknowledgement affordances only if written originally and kept non-performative.
- Avoid pushy partner-invite flows. Invites should frame participation as optional shared planning, not accusation.
- Future versions must define export, deletion, household exit, access revocation, and retention before storing real user data at scale.

## Review Readiness Criteria

Before implementation, a design/product agent must be able to answer yes to all of these:

- Does the feature avoid source text, source taxonomy, source UI copy, source assessment wording, source exercises, source scripts, and source visual design?
- Does the feature use original names, prompts, examples, data, and visual treatments?
- Does any starter content have a recorded IP review decision?
- Are private, shared, partner-visible, and check-in-only states explicit wherever sensitive notes can exist?
- Does the authentication/session plan document password hashing, cookie settings, expiration, logout, and failed-login protection?
- Does the flow avoid partner scoring, blame labels, diagnosis, therapy advice, and unsafe-confrontation prompts?
- Does the UI provide a way to pause, defer, archive, or keep a note private?
- Is the feature's audit/history useful for clarity without becoming a grievance archive?

## Future Process

Before implementation uses any reference-derived idea, document:

- Source artifact consulted.
- Proposed product use.
- Whether the output is broad idea, transformed model, original copy, starter content, visual design, or assessment/prompt wording.
- IP risk level.
- Privacy/safety risk level.
- Approval decision and reviewer.

If the proposed work includes user-facing copy, templates, categories, prompts, assessment questions, seed/demo data, visual card treatment, partner invites, concern boards, check-ins, metrics, export, deletion, or auth/session behavior, update this review or create a linked review note before writing production code.
