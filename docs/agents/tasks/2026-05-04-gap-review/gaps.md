# Gaps

## Blockers

No blockers were found for implementation decomposition.

The following items should stop public production launch, but they do not need to stop local implementation planning:

- Final legal/IP review is still required before shipping any starter template library, assessment, copied-adjacent prompt set, card-like visual treatment, or source-inspired educational flow.
- Final safety-reviewed onboarding/help copy is still required before public launch.
- Export, deletion, household exit, access revocation, and retention policies remain out of v1 scope and must be defined before storing real user data at scale.

## Implementation Decisions

- Onboarding route is referenced in user flows but not listed in v1 routes. Default: add `/app/onboarding` as a skippable post-persona screen that can route to blank responsibility creation, a tiny demo example, or the load map.
- Persona display preferences are mentioned while prior architecture keeps fixed Alex/Max personas. Default: keep fixed `alex` and `max` keys and default display names for v1; allow only active persona switching and non-sensitive avatar/display presentation unless custom names are explicitly added to the implementation plan.
- Private draft semantics need precision. Default: persist private radar drafts server-side with `createdByPersonaId` and `visibility=private`; filter them by selected persona in the UI/API, but state in product copy that shared credentials are not per-person secrecy.
- Responsibility visibility is broader than the core v1 flows require. Default: responsibilities are `shared_household` by default; reserve private visibility for radar drafts unless the implementation plan explicitly adds private responsibility drafts.
- `shared_household`, `partner_visible`, and `check_in_only` need behavior definitions. Default: use `shared_household` for normal records, `check_in_only` for agenda-only visibility, and reserve `partner_visible` for future notification/attention flows unless needed by a v1 screen.
- Auth parameters are open. Default: Argon2id with memory cost 64 MiB, time cost 3, parallelism 1, 16-byte or larger salt, 32-byte hash, and a versioned `hashParamsVersion`.
- Session expiration is open. Default: server-managed opaque sessions with a 7-day idle timeout, 30-day absolute timeout, rotation on persona selection and login, and logout revocation.
- Failed-login protection is open. Default: throttle by normalized username and IP, allow 5 failed attempts per 15 minutes before a short cooldown, and keep messages generic.
- Vercel Postgres provider is open. Default: choose a Vercel Marketplace Postgres-compatible provider during environment setup, document `DATABASE_URL`, and keep Prisma provider `postgresql`.
- Demo seed review is not recorded as a separate approval. Default: implementation may use only the tiny examples already listed in the product docs, and should run a quick IP/safety review before placing them in code, tests, fixtures, screenshots, or seed scripts.
- PWA scope is light. Default: implement responsive mobile-first UI, app metadata, manifest, icons, and safe installability; defer offline caching/service worker for sensitive household data.
- Check-in history retention is not fully specified. Default: retain factual decisions/events for v1, hide grievance-like timelines from primary UI, and avoid permanent deletion controls until the post-v1 data-control review.

## Nice-To-Have / Future

- Individual accounts, email login, social auth, magic links, and partner invites.
- Custom persona names or additional household members beyond Alex and Max.
- Full export, deletion, household separation, access revocation, and retention management.
- A broader starter responsibility library, if separately IP-reviewed.
- Push notifications or partner-visible notification behavior.
- Offline-first PWA behavior.
- Paid features, billing, marketplace, public sharing, and community features.
- Native iOS app implementation.

## Contradictions Checked

- Earlier research proposed a separate `shared` responsibility status; current product docs resolve sharing as assignment roles. No action needed.
- Earlier research raised child-specific load and broader households; current v1 is two personas with original area tags that can represent care work generically. No action needed for v1.
- Earlier research raised partner comparison risks; current product docs consistently require aggregate, non-punitive load signals. No action needed.
- Product docs reference private drafts and also warn that shared credentials are not secret. This is not a blocker, but implementation and copy must preserve that distinction.
