# Learned

## IP Position

- The product can safely use broad, non-exclusive ideas: invisible household coordination, explicit ownership, recurring review, calm handoff, private drafting, aggregate load summaries, and user-authored household standards.
- Future implementation must not copy or closely paraphrase any book text, assessment wording, public app UI copy, workbook text, Trello card/list/label names, card descriptions, PDF card text, source examples, source exercises, or source prompt structures.
- A responsibility library is the highest IP-risk area. V1 should prefer user-authored responsibilities or a very small set of invented examples that have been reviewed against all reference artifacts.
- The app should not ship a source-like card deck, printable-card visual system, 100/101-item catalog, branded method structure, source-like category distribution, or source-derived scoring mechanics.
- Internal docs may refer to source names for provenance and risk tracking, but product requirements, seed data, tests, fixtures, and UI copy should use original language.

## Privacy Position

- V1 can support a simple household login without email: one household username/password and two in-house personas selected after authentication.
- The household password must be stored only as a slow password hash. Acceptable choices include Argon2id, bcrypt, or scrypt with current production parameters.
- Sessions should be server-managed with opaque tokens in `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Sensitive household data, private drafts, and partner-visible notes should not be stored in `localStorage` or long-lived client storage.
- Persona selection is not strong identity. The product must not imply that one partner cannot view another partner's information once they share the household password.
- Vercel-compatible persistence should use a managed database for household records and server-side session storage or signed/encrypted cookie session references. No email delivery, magic links, or email identifiers are required for v1.

## Relationship-Safety Position

- The app is household organization and relationship support, not therapy, diagnosis, crisis support, legal advice, medical advice, or abuse intervention.
- Product language should externalize the household system and avoid treating either person as defective, irresponsible, or clinically disordered.
- The app must not encourage confrontation in unsafe, coercive, violent, surveilled, or retaliatory relationships.
- Imbalance summaries should be aggregate and non-punitive. Do not produce a "bad partner" score, blame ledger, morality grade, or shareable proof of failure.
- Sensitive notes need clear visibility states: private draft, shared household record, partner-visible item, and bring-to-check-in item.

## Product Implications

- Use calm wording around clarity, capacity, blockers, commitments, and review.
- Require explicit confirmation before moving a private draft into shared or partner-visible space.
- Keep check-ins agenda-like and decision-focused, with room to pause, skip, or revisit later.
- Make deletion, archive, export, and household exit explicit future requirements before any paid or production release.
- Treat opt-in visibility, privacy labels, and session boundaries as core design requirements, not later polish.
