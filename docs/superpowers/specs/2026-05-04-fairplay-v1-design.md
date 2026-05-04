# Fairplay v1 Design Spec

## Intent

Define the first product shape and architecture for a household responsibility planning app while keeping implementation separate from this task.

## Product Promise

Help households make work visible, assign ownership clearly, and revisit decisions through calm check-ins without blame, diagnosis, or source-derived methods.

## Primary Users

- A two-person household represented by the default personas Alex and Max.
- A solo starter who creates the shared household and begins mapping responsibilities.
- A returning household member who logs in with shared credentials and chooses the correct persona for the session.

## Non-Clinical Product Boundary

Fairplay v1 is household organization and relationship support. It can help users clarify responsibilities, expectations, blockers, handoffs, and review dates. It must not provide therapy, counseling, diagnosis, crisis support, legal advice, medical advice, financial advice, or unsafe-confrontation coaching.

Every relationship-support surface should preserve a practical tone: clarify, pause, revisit, adjust, ask for support, and define the next step.

## Core Capabilities

- Household creation with one household username and password.
- Secure login and post-login persona selection between Alex and Max.
- Mobile-first onboarding and education.
- Load map / responsibility overview.
- Responsibility creation, assignment, editing, pausing, archiving, and review scheduling.
- Shared radar for concerns, blockers, unclear expectations, and check-in topics.
- Guided check-in flow with decisions, deferred items, and review dates.
- Persisted data and aggregate load snapshots.
- Tiny original demo seed set for QA/onboarding, subject to IP review.

## Technology Architecture

- Web app: Next.js App Router.
- Language: TypeScript.
- UI styling: Tailwind CSS.
- Hosting: Vercel.
- Database: Postgres-compatible managed database through Vercel Marketplace storage.
- ORM: Prisma.
- API posture: explicit JSON Route Handlers and shared TypeScript domain types. Server Actions are allowed only as web form adapters over the same domain logic.
- PWA posture: responsive mobile-first layout, install-friendly metadata later, no dependency on native-only APIs.

Prisma is the v1 choice because it is conservative, familiar, strongly typed for TypeScript teams, and well suited to a Postgres schema with explicit relationships. Physical migrations are out of scope for this product architecture task.

## Domain Architecture

Core logic should live behind platform-neutral concepts:

- Household and credential management.
- Persona selection and session state.
- Responsibility lifecycle and assignment rules.
- Radar item visibility and publishing rules.
- Check-in agenda, decision, and summary rules.
- Load snapshot calculation and non-punitive presentation rules.

The future iOS app should be able to call the same JSON contracts and render the same domain states without knowing about React components, Server Actions, or browser storage.

## Auth and Privacy

V1 uses simple shared household authentication:

- One household username.
- One household password.
- Two default personas: Alex and Max.
- Both people may use the same credentials and choose their persona after login.

Requirements:

- Store only slow password hashes, preferably Argon2id.
- Never store, log, seed, or return plaintext passwords.
- Use server-managed sessions or signed/encrypted opaque session references.
- Use `HttpOnly`, `Secure`, and `SameSite=Lax` cookies.
- Preserve household id and selected persona id in the session.
- Provide logout that invalidates the active session.
- Add failed-login protection before public launch.
- Do not store household records, drafts, concern details, or session secrets in `localStorage`.

Because credentials are shared, v1 must not promise that one persona's data is secret from anyone who knows the household login.

## Routes and Screens

- `/create-household`: shared credential setup.
- `/login`: household login.
- `/choose-persona`: Alex/Max selection.
- `/app/home`: summary, open radar, due reviews, next check-in.
- `/app/load-map`: responsibility overview and filters.
- `/app/responsibilities/new`: create responsibility.
- `/app/responsibilities/[id]`: edit, assign, pause, archive, flag, review.
- `/app/radar`: shared concern board and private drafts.
- `/app/check-ins/new`: guided check-in setup.
- `/app/check-ins/[id]`: active or completed check-in.
- `/app/settings`: household display settings, persona display preferences, logout, future data controls.

## V1 Data Entities

- `Household`
- `HouseholdCredential`
- `Persona`
- `Session`
- `Responsibility`
- `ResponsibilityAssignment`
- `ResponsibilityLifecycleNotes`
- `ResponsibilityTemplate`
- `RadarItem`
- `CheckIn`
- `CheckInItem`
- `Decision`
- `ResponsibilityEvent`
- `LoadSnapshot`

See `docs/product/data-model.md` for fields, enum candidates, and JSON contract examples.

## Responsibility Model

A responsibility is a durable unit of household accountability. It is not just a task. It can include:

- User-authored title and summary.
- Area tags from an original small taxonomy.
- Hidden effort dimensions such as noticing, planning, doing, follow-through, and emotional attention.
- Cadence and optional relevant days.
- Current status.
- Visibility.
- Household-authored standard.
- Optional lifecycle notes.
- Current and historical assignments.
- Review dates and radar links.

Ownership roles:

- Accountable owner.
- Shared owner.
- Helper.
- Backup.

Responsibility statuses:

- Unassigned.
- Active.
- Needs review.
- Paused.
- Not relevant.
- Archived.

## Radar and Check-Ins

Radar is for surfacing topics, not scoring people. A radar item can be a blocker, unclear expectation, handoff need, review-due item, or other household concern. It can be private, shared household, partner-visible, or check-in-only.

The check-in flow should:

- Suggest a short agenda from open radar items, due reviews, recent changes, and optional appreciation.
- Let users skip or defer any topic.
- Capture factual decisions and next review dates.
- Update responsibilities only through explicit decisions.
- Summarize commitments without turning history into a grievance archive.

## Load Signals

V1 can show aggregate household signals:

- Owner distribution.
- Shared responsibility count.
- High-frequency responsibility count.
- Open radar count.
- Due-for-review count.
- Paused/not-relevant count.
- Hidden effort mix.
- Area mix.

Do not show a bad-partner score, winner/loser summary, morality grade, diagnosis, or source-derived assessment result.

## Demo Seed Content

V1 may include a tiny reviewed demo set with original categories and invented examples:

- Areas: Home base, Food flow, Calendar lane, Care circle, Paper trail, Fix and fetch, Recharge, Big shifts.
- Examples: Evening kitchen reset, Weekly meal outline, Appointment follow-through, Laundry rhythm, Supply restock, Weekend plan check, Shared space reset, Bill due-date review.

This is for demo/QA/onboarding only. Do not create a full starter deck, 100-item catalog, worksheet clone, copied category system, source card text, Better Share wording, public app labels, or source-derived visuals.

## Visual and Interaction Direction

- Mobile-first screens with dense but calm information.
- Cute original cartoon characters may represent Alex and Max, but must not use source deck visuals, source character designs, or copied public app art.
- Lightweight animations are appropriate for transitions, check-in progress, empty states, and success states.
- Diagrams can explain household load and check-in flow, but must use original shapes, labels, and copy.
- Responsibility summaries may be compact panels, but should not mimic printable cards, physical decks, source card dimensions, or source visual density.

## Safety and IP Constraints

- Do not embed private reference text, card names, source examples, assessment language, prompts, scripts, deck visuals, workbook labels, formulas as user-facing scoring, Better Share public UI labels, or source-derived taxonomies.
- Keep language neutral and non-accusatory.
- Require confirmation before publishing private drafts to shared or partner-visible spaces.
- Make pause, defer, archive, and not-relevant actions normal and non-shaming.
- Add non-clinical and unsafe-relationship boundaries before public launch.

## README Deployment Notes Required Later

When implementation begins, README instructions should cover:

- Node.js 20.9 or newer.
- `create-next-app@latest` App Router scaffold direction.
- Environment variables configured outside source and encrypted at rest by Vercel.
- Vercel Marketplace database connection.
- Prisma setup/migration commands.
- Password/session secrets.
- Local development and Vercel deployment steps.

No app scaffold or deployment instructions are added by this architecture task.

## Open Questions

- Exact Argon2id parameters and session expiration windows.
- Exact failed-login protection thresholds.
- Which Vercel Marketplace Postgres provider the implementation will connect.
- Final safety-reviewed onboarding copy.
- Final review of demo seed content before it enters code, tests, or screenshots.

## Resolved Defaults and Remaining Gaps

Implementation decomposition may proceed with no blocking product contradiction found. Use these conservative defaults unless a later product review changes them:

- Add `/app/onboarding` as the skippable post-persona setup route referenced by user flows.
- Keep fixed v1 persona keys and default display names, `alex` and `max`; treat custom persona naming as future scope unless explicitly added to the implementation plan.
- Treat persona-private drafts as server-persisted, persona-filtered UX records, not true secrecy from someone who knows the shared household credentials.
- Keep responsibilities shared-household by default; reserve private visibility for radar drafts unless a specific v1 flow adds private responsibility drafts.
- Use Argon2id with versioned parameters, server-managed opaque sessions, idle and absolute expiration, logout revocation, and failed-login throttling by normalized username and IP.
- Implement PWA support as responsive mobile-first UI, metadata, manifest, and icons; defer offline caching of sensitive household data.
- Do not add partner invites, a full starter library, individual accounts, export/deletion controls, billing, or native iOS work in v1 implementation.
