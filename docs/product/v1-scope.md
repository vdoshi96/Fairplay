# Fairplay v1 Scope

## Goal

Create a mobile-first household responsibility planning tool that helps two household partners make shared work visible, assign ownership clearly, and revisit decisions through calm recurring check-ins.

Fairplay v1 is household organization and relationship support. It is not therapy, counseling, diagnosis, legal advice, financial advice, medical advice, or crisis support.

## Target Users

- A two-person household using the default personas Alex and Max.
- A solo starter who creates the household and begins mapping responsibilities before the second persona participates.
- Households that want practical support for responsibilities, expectations, hidden coordination, and check-ins without partner scoring or blame.

## In Scope

- Account creation with one household username and one household password.
- Login with the shared household credentials.
- Post-login persona selection between Alex and Max.
- Session persistence that preserves household and selected persona.
- Secure password handling: slow password hashes only, never plaintext.
- Mobile-first PWA-friendly web UI deployable to Vercel.
- Onboarding and education that explain the product as practical household planning, not clinical advice.
- Household load map with responsibility overview, ownership state, cadence, review timing, hidden effort dimensions, and status.
- Responsibility creation and editing using user-authored titles, notes, standards, tags, and cadence.
- Assignment between Alex and Max using explicit roles such as accountable owner, shared owner, helper, and backup.
- Guided check-in flow that reviews selected responsibilities and saved agenda items, records decisions, and allows deferring tense topics.
- Persisted household, persona, responsibility, assignment, check-in, decision, event, and snapshot data.
- Small demo/seed data made from original categories and invented examples only, reviewed before implementation.
- README deployment instructions for the eventual Vercel app setup.

## Architecture Direction

- Use Next.js App Router, TypeScript, and Tailwind CSS for the web app.
- Deploy to Vercel and keep runtime assumptions compatible with serverless hosting.
- Use a Postgres-compatible managed database connected through Vercel Marketplace storage.
- Use Prisma as the v1 ORM because it provides a conservative typed schema/migration workflow, strong TypeScript support, and broad Postgres familiarity for future contributors.
- Keep domain services and JSON API contracts platform-neutral so a future iOS app can share the same concepts without depending on React components or web-only form behavior.
- Prefer Route Handlers for explicit JSON APIs. Server Actions may be used for web form ergonomics only when they call the same domain/service layer.

## Out of Scope

- Legal, financial, therapeutic, or medical advice.
- Marketplace, community, or public sharing features.
- Automated ingestion of private reference source materials.
- Email login, magic links, social auth, and external identity providers.
- Per-person secret accounts or claims that one persona's data is hidden from someone who knows the shared household credentials.
- A full starter deck, source-like responsibility library, copied assessment, copied public app flow, source-derived taxonomy, printable-card UI, or source visuals.
- Partner scoring, winner/loser comparisons, morality grades, diagnosis, or confrontation prompts.
- AI advice or therapy-like rewriting in v1.
- Billing, subscriptions, public sharing, exports, deletion workflows, and household exit/revocation. These need later privacy and product review.
- Production app implementation in this architecture task.

## V1 Information Architecture

- `/` redirects signed-in households to the app home and signed-out visitors to login/create household.
- `/create-household` creates the shared household credentials and default personas.
- `/login` accepts household username/password.
- `/choose-persona` lets the signed-in user select Alex or Max for the session.
- `/app/home` shows household learning entry points, due reviews, and next check-in.
- `/app/load-map` lists responsibilities with filters for owner, status, cadence, tag, and review timing.
- `/app/responsibilities/new` and `/app/responsibilities/[id]` create/edit a responsibility.
- `/app/check-ins/new` starts a guided check-in.
- `/app/check-ins/[id]` resumes or reviews a check-in.
- `/app/settings` manages household name, persona display preferences, logout, and future data controls.

## Demo Seed Boundaries

V1 may include a tiny demo household or resettable seed state for screenshots, QA, and onboarding examples. It must use original names and invented content, such as:

- Areas: Home base, Food flow, Calendar lane, Care circle, Paper trail, Fix and fetch, Recharge, Big shifts.
- Example responsibilities: Evening kitchen reset, Weekly meal outline, Appointment follow-through, Laundry rhythm, Supply restock, Weekend plan check, Shared space reset, Bill due-date review.

Do not expand this into a source-like deck or catalog. Demo examples must not copy source card names, categories, descriptions, worksheet labels, Better Share wording, or source visuals.

## Success Criteria

- A household can represent its current work clearly.
- Ownership and handoff expectations are explicit.
- The interface encourages calm review rather than blame.
- Alex and Max can use the same household credentials, choose their persona, and see a consistent shared household state.
- Users can defer tense topics, restart learning flows, and record check-in decisions without partner scoring.
- The domain model and API contracts are reusable by a future iOS client.
