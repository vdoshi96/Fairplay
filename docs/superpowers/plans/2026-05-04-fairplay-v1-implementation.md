# Fairplay v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Fairplay v1 as a mobile-first household responsibility planning web app with shared household auth, persona-aware sessions, persisted responsibilities, radar items, and guided check-ins.

**Architecture:** Use a Next.js App Router app with explicit JSON Route Handlers, platform-neutral TypeScript contracts, Prisma-backed Postgres persistence, and a mobile-first PWA baseline. Keep sensitive household data on the server, use neutral non-clinical language, and preserve future iOS compatibility by separating domain/contracts from React UI.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Prisma, Postgres-compatible Vercel Marketplace storage, Docker Compose local Postgres, Vitest, React Testing Library, Playwright, ESLint, Vercel.

---

## Required Reading For Every Worker

- `README.md`
- `docs/product/ip-safety-review.md`
- `docs/product/v1-scope.md`
- `docs/product/user-flows.md`
- `docs/product/data-model.md`
- `docs/product/visual-system.md`
- `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`
- `docs/agents/tasks/2026-05-04-gap-review/handoff.md`

Every worker must preserve these boundaries:

- Do not consult or copy private `References/` materials.
- Do not add source-derived category systems, prompts, assessment copy, public app labels, deck/card visuals, workbook wording, starter catalogs, or source-like examples.
- Do not add partner scores, winner/loser comparisons, morality grades, diagnosis, clinical advice, legal/medical/financial advice, crisis support, or unsafe-confrontation coaching.
- Do not store household records, drafts, concern details, or session secrets in `localStorage`.
- Treat persona-private radar drafts as server-persisted and persona-filtered UX records, not as true secrecy from someone with the shared household credentials.
- Keep PWA work limited to responsive installability, metadata, and icons; do not add offline caching of sensitive household data in v1.

## Branch And Commit Strategy

- Docs/spec PR: open from `codex/research-and-spec` to `main`.
- Implementation branch: create `codex/v1-app` from `codex/research-and-spec` if implementation begins before the docs PR merges; otherwise create it from updated `main`.
- Keep commits task-scoped. Each implementation task below names the expected commit scope.
- If parallel subagents are used, dispatch only tasks with disjoint owned files or tasks whose dependencies are already merged into the implementation branch.
- Never revert edits made by another worker. If ownership conflicts appear, stop and ask the controller to serialize the tasks.

## File Ownership Map

These ownership boundaries are the default. A later task may modify a file created by an earlier task only when the task explicitly lists that file under "Modify".

- Scaffold/config: `package.json`, lockfile, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `postcss.config.*`, `tailwind.config.*`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `.env.example`, `.gitignore`.
- Shared domain/contracts: `src/domain/**`, `src/contracts/**`, `src/seed/**`, `src/lib/safety-copy.ts`, `src/lib/formatting.ts`, `src/test/factories/**`.
- Persistence: `prisma/**`, `src/server/db/**`, `src/server/repositories/**`, `compose.yaml`, `scripts/db/**`.
- Auth/session/persona APIs: `src/server/auth/**`, `src/app/api/auth/**`, `src/app/api/personas/**`, `src/middleware.ts`, auth-focused tests.
- App shell/auth/persona/onboarding UI: `src/app/(auth)/**`, `src/app/app/layout.tsx`, `src/app/app/home/page.tsx`, `src/app/app/onboarding/page.tsx`, `src/app/app/settings/page.tsx`, `src/components/app-shell/**`, `src/components/auth/**`, `src/components/onboarding/**`.
- Load map/responsibilities: `src/server/responsibilities/**`, `src/app/api/responsibilities/**`, `src/app/api/load-snapshot/**`, `src/app/app/load-map/**`, `src/app/app/responsibilities/**`, `src/components/responsibilities/**`.
- Radar: `src/server/radar/**`, `src/app/api/radar/**`, `src/app/app/radar/**`, `src/components/radar/**`.
- Check-ins: `src/server/check-ins/**`, `src/app/api/check-ins/**`, `src/app/app/check-ins/**`, `src/components/check-ins/**`.
- Visual integration: `public/assets/fairplay/**`, `src/components/visuals/**`, `src/components/motion/**`, `src/app/globals.css`, `tailwind.config.*`.
- README/Vercel readiness: `README.md`, `vercel.json`, `.env.example`, `docs/deployment/**`.
- Final verification: no production source ownership except small docs updates approved by the controller.

## Review Requirement For Every Implementation Task

After a worker finishes a task and its checks pass, request reviews in this order:

1. Spec compliance review: verify behavior against `docs/product/ip-safety-review.md`, `docs/product/v1-scope.md`, `docs/product/user-flows.md`, `docs/product/data-model.md`, and `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`.
2. Code quality review: verify correctness, security, maintainability, test coverage, accessibility, performance, and Vercel readiness.

Do not start the next dependent task until blocking findings from both reviews are resolved.

---

### Task T01: App Scaffold, Dependencies, Config, And PWA Baseline

**Expected branch/commit scope:** `codex/v1-app`, commit `chore: scaffold Fairplay app baseline`

**Owned files/directories:**

- Create/modify: `package.json`, lockfile, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `postcss.config.*`, `tailwind.config.*`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/manifest.ts`, `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `.env.example`, `.gitignore`
- Create: `vitest.config.*`, `playwright.config.*`, `src/test/setup.ts`

**Must not touch:**

- `src/domain/**`, `src/contracts/**`, `src/server/**`, `prisma/**`, feature route folders beyond root app files, README deployment content.

**Inputs:**

- `README.md`
- `docs/product/v1-scope.md`
- `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`

**Behavior requirements:**

- Scaffold a Next.js App Router app with TypeScript, Tailwind CSS, ESLint, and `src/`.
- Use Node.js `>=20.9.0`; document this in `package.json` `engines`.
- Add scripts:
  - `dev`: run Next.js locally.
  - `build`: build the app.
  - `start`: run the production build.
  - `lint`: run ESLint.
  - `typecheck`: run `tsc --noEmit`.
  - `test`: run Vitest once.
  - `test:watch`: run Vitest watch mode.
  - `test:e2e`: run Playwright tests.
- Install baseline dependencies for planned tasks: Next.js, React, Tailwind, Prisma CLI/client, Zod, `@node-rs/argon2`, `nanoid` or `crypto`-based id helpers, Vitest, Testing Library, Playwright.
- Add PWA-friendly metadata, `manifest.ts`, generated icon routes, responsive viewport settings, and a root page that redirects signed-out users toward `/login` after auth exists.
- Do not add a service worker or offline caching of household data.
- Add `.env.example` keys with placeholder values only:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `AUTH_COOKIE_NAME=fairplay_session`
  - `APP_BASE_URL=http://localhost:3000`

**Tests/checks expected:**

- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run`
- Run: `npm run build`
- Run: `npm run test:e2e` after adding a smoke test that confirms `/` returns a non-error page.

**Review points:**

- Spec compliance review must confirm the scaffold does not add source-derived copy, app code beyond baseline, offline sensitive-data caching, or unsupported product scope.
- Code quality review must confirm package scripts work, TypeScript config is strict enough for app work, and the PWA baseline is install-friendly without caching sensitive data.

**Order/dependencies:**

- First implementation task.
- All later tasks depend on this scaffold.

---

### Task T02: Shared Domain Contracts And Reviewed Seed Content

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add shared domain contracts`

**Owned files/directories:**

- Create: `src/domain/enums.ts`
- Create: `src/domain/ids.ts`
- Create: `src/domain/time.ts`
- Create: `src/domain/visibility.ts`
- Create: `src/domain/load-signals.ts`
- Create: `src/contracts/auth.ts`
- Create: `src/contracts/personas.ts`
- Create: `src/contracts/responsibilities.ts`
- Create: `src/contracts/radar.ts`
- Create: `src/contracts/check-ins.ts`
- Create: `src/seed/demo-content.ts`
- Create: `src/lib/safety-copy.ts`
- Create: `src/lib/formatting.ts`
- Create: `src/test/factories/domain.ts`
- Create tests under `src/domain/**/*.test.ts`, `src/contracts/**/*.test.ts`, and `src/seed/demo-content.test.ts`

**Must not touch:**

- `src/app/**` route UI, `src/server/**`, `prisma/**`, auth/session implementation, package/dependency files unless a test dependency is missing and approved by the controller.

**Inputs:**

- `docs/product/data-model.md`
- `docs/product/ip-safety-review.md`
- `docs/product/v1-scope.md`
- `docs/product/user-flows.md`
- `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`

**Behavior requirements:**

- Define stable TypeScript string enums matching the data model:
  - `PersonaKey`: `alex`, `max`
  - `ResponsibilityStatus`: `unassigned`, `active`, `needs_review`, `paused`, `not_relevant`, `archived`
  - `AssignmentRole`: `accountable_owner`, `shared_owner`, `helper`, `backup`
  - `AssignmentScope`: `outcome`, `part`, `support`, `temporary`
  - `Visibility`: `private`, `shared_household`, `partner_visible`, `check_in_only`
  - `Cadence`: `daily`, `weekly`, `monthly`, `seasonal`, `event_based`, `as_needed`, `one_time`
  - `HiddenEffortKey`: `noticing`, `planning`, `doing`, `follow_through`, `emotional_attention`
  - `RadarReasonKey`: `unclear_expectation`, `blocked`, `too_much`, `handoff_needed`, `review_due`, `other`
  - `Urgency`: `low`, `normal`, `soon`
  - `RadarState`: `draft`, `open`, `scheduled`, `discussed`, `resolved`, `dismissed`, `deferred`
  - `CheckInState`: `draft`, `scheduled`, `active`, `completed`, `skipped`
  - `CheckInItemState`: `queued`, `discussed`, `deferred`, `skipped`
  - `DecisionType`: `assign_owner`, `change_role`, `change_standard`, `change_cadence`, `pause`, `mark_not_relevant`, `archive`, `schedule_review`, `custom_note`
  - `SourceReviewStatus`: `not_reviewed`, `approved_original`, `blocked`, `needs_review`
- Define Zod schemas and exported TypeScript types for JSON contracts:
  - create household request/response
  - login request/response
  - select persona request/response
  - responsibility summary/detail/create/update/archive/pause/assignment mutation
  - radar summary/detail/create/update/publish/defer/resolve mutation
  - check-in create/agenda/item decision/complete mutation
  - load snapshot summary
- Add domain helpers:
  - normalize usernames by trimming, lowercasing, and collapsing internal whitespace/hyphen differences consistently.
  - assert valid persona key and visibility transitions.
  - compute load signals without producing any per-person score or winner/loser result.
- Add the tiny approved-original demo content only:
  - Areas: `home_base`, `food_flow`, `calendar_lane`, `care_circle`, `paper_trail`, `fix_and_fetch`, `recharge`, `big_shifts`.
  - Examples: `Evening kitchen reset`, `Weekly meal outline`, `Appointment follow-through`, `Laundry rhythm`, `Supply restock`, `Weekend plan check`, `Shared space reset`, `Bill due-date review`.
  - Mark every seed template with `sourceReviewStatus: "approved_original"` and a `contentVersion`.
- Add `src/lib/safety-copy.ts` with short original copy snippets for non-clinical boundary, unsafe relationship caution, private draft publishing confirmation, and defer/pause language. Copy must be neutral and practical.

**Tests/checks expected:**

- Unit test enum arrays and Zod schemas accept documented examples from `docs/product/data-model.md`.
- Unit test invalid visibility transitions fail, especially publishing `private` to shared/partner-visible without an explicit confirmation flag in the mutation schema.
- Unit test load signal calculations return aggregate counts only and contain no `score`, `winner`, `loser`, `grade`, or diagnostic labels.
- Unit test seed content includes exactly the approved areas/examples and no larger starter catalog.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/domain src/contracts src/seed`

**Review points:**

- Spec compliance review must inspect every user-facing seed/copy string against the IP and relationship-safety review.
- Code quality review must confirm schemas are reusable by Route Handlers and future iOS clients because they do not depend on React or browser state.

**Order/dependencies:**

- Depends on T01.
- T03 through T08 depend on these enums and contracts.

---

### Task T03: Persistence Layer, Prisma Schema, And Local Postgres Verification

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add Prisma persistence layer`

**Owned files/directories:**

- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/server/db/prisma.ts`
- Create: `src/server/db/errors.ts`
- Create: `src/server/repositories/households.ts`
- Create: `src/server/repositories/personas.ts`
- Create: `src/server/repositories/sessions.ts`
- Create: `src/server/repositories/responsibilities.ts`
- Create: `src/server/repositories/radar.ts`
- Create: `src/server/repositories/check-ins.ts`
- Create: `src/server/repositories/load-snapshots.ts`
- Create: `src/server/repositories/auth-throttle.ts`
- Create: `compose.yaml`
- Create: `scripts/db/wait-for-db.mjs`
- Modify: `.env.example`
- Modify: `package.json` scripts only for Prisma/db commands

**Must not touch:**

- UI routes/components under `src/app/**` and `src/components/**`.
- Auth password hashing/session-cookie logic under `src/server/auth/**`.
- Contract enum names from T02 unless coordinated with the controller and reflected in all downstream tasks.

**Inputs:**

- T02 domain/contracts.
- `docs/product/data-model.md`.
- `docs/product/ip-safety-review.md`.

**Behavior requirements:**

- Use Prisma provider `postgresql`.
- Model all v1 entities from the data model:
  - `Household`, `HouseholdCredential`, `Persona`, `Session`, `Responsibility`, `ResponsibilityAssignment`, `ResponsibilityLifecycleNotes`, `ResponsibilityTemplate`, `RadarItem`, `CheckIn`, `CheckInItem`, `Decision`, `ResponsibilityEvent`, `LoadSnapshot`.
- Add an implementation-support model for failed login protection, named `AuthThrottle` or `LoginAttempt`, keyed by normalized username and IP hash.
- Use UUID string ids, `createdAt`, and `updatedAt` consistently.
- Enforce unique household usernames with `usernameNormalized`.
- Enforce one `alex` and one `max` persona per household through a compound uniqueness rule.
- Store password hashes and session ids only as hashes or opaque references. The schema must not include plaintext password fields.
- Store radar visibility and state explicitly.
- Store responsibility assignment history with `startsAt` and nullable `endsAt`.
- Keep load snapshots aggregate and free of scoring fields.
- Add `compose.yaml` for local Postgres so workers can verify without Vercel credentials.
- Extend `.env.example` with a local Docker `DATABASE_URL` example and comments that real credentials stay outside source.
- Add scripts:
  - `prisma:generate`
  - `prisma:validate`
  - `prisma:migrate`
  - `prisma:seed`
  - `db:up`
  - `db:down`
  - `db:wait`
- Add repository functions that map Prisma records to T02 contract/domain types and hide Prisma internals from API handlers.
- Add seed behavior that creates only the approved demo templates, not a full catalog.

**Tests/checks expected:**

- Run: `npm run prisma:validate`
- Run: `npm run prisma:generate`
- Run: `npm run db:up`
- Run: `npm run db:wait`
- Run: `npm run prisma:migrate -- --name init`
- Run: `npm run prisma:seed`
- Run repository integration tests against local Postgres:
  - create household with Alex/Max personas.
  - reject duplicate normalized username.
  - create responsibility with assignments and derive current assignments.
  - create private radar draft and ensure repository queries filter by selected persona.
  - create check-in, item, decision, and completed summary.
  - compute load snapshot without scores.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/server/repositories`
- Run: `npm run db:down`

**Review points:**

- Spec compliance review must verify schema fields preserve the documented data model and privacy requirements.
- Code quality review must inspect repository boundaries, Prisma connection reuse for serverless, migration safety, test isolation, and no plaintext secret storage.

**Order/dependencies:**

- Depends on T01 and T02.
- T04 through T08 depend on the repository layer.

---

### Task T04: Auth, Session, Persona APIs, Password Hashing, Cookies, And Throttling

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add household auth APIs`

**Owned files/directories:**

- Create: `src/server/auth/passwords.ts`
- Create: `src/server/auth/sessions.ts`
- Create: `src/server/auth/cookies.ts`
- Create: `src/server/auth/throttle.ts`
- Create: `src/server/auth/current-session.ts`
- Create: `src/app/api/auth/create-household/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/api/personas/select/route.ts`
- Create: `src/middleware.ts`
- Create tests under `src/server/auth/**/*.test.ts` and `src/app/api/auth/**/*.test.ts`

**Must not touch:**

- Auth UI pages/components from T05.
- Prisma schema from T03 unless a blocker is found and the controller approves a schema patch.
- Responsibility, radar, or check-in feature logic.

**Inputs:**

- T02 contracts.
- T03 repositories.
- `docs/product/user-flows.md`.
- `docs/product/ip-safety-review.md`.
- `docs/agents/tasks/2026-05-04-gap-review/handoff.md`.

**Behavior requirements:**

- Create household API:
  - Validate household name, username, password, and timezone with T02 schema.
  - Normalize username.
  - Require password length of at least 12 characters.
  - Hash passwords with Argon2id using versioned parameters:
    - algorithm `argon2id`
    - memory cost `19456`
    - time cost `2`
    - parallelism `1`
    - hash length `32`
    - params version `v1`
  - Store only the password hash and hash metadata.
  - Create default personas `Alex` and `Max` with keys `alex` and `max`.
  - Create an opaque server-managed session.
  - Return household/persona summary and `requiresPersonaSelection: true`.
- Login API:
  - Use generic error messages that do not reveal whether username or password failed.
  - Apply failed-login throttling by normalized username and IP hash.
  - Defaults: 5 failed attempts in 15 minutes triggers a 15-minute throttle window.
  - Reset throttle counter after successful login.
  - Create a session requiring persona selection.
- Session behavior:
  - Cookie name from `AUTH_COOKIE_NAME`, default `fairplay_session`.
  - Cookie is `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`, max age matching absolute expiration.
  - Session idle expiration: 7 days since `lastSeenAt`.
  - Session absolute expiration: 30 days since `createdAt`.
  - Store only an opaque session token in the browser and only a token hash in the database.
  - Logout revokes the session and clears the cookie.
  - `me` returns household and selected persona state without sensitive fields.
- Persona selection:
  - Only accepts persona ids belonging to the session household.
  - Updates the session with `selectedPersonaId`.
  - Allows explicit persona switch with the same route.
- Middleware:
  - Redirect signed-out users away from `/app/**` to `/login`.
  - Redirect signed-in users without selected persona to `/choose-persona` except for auth/persona APIs.
  - Never expose household data or secrets in client storage.

**Tests/checks expected:**

- Unit test password hashing verifies `verify(hash, password)` succeeds and wrong passwords fail.
- Unit test session token hashing confirms raw token is never persisted.
- API tests:
  - create household stores hash, creates two personas, sets cookie, and returns no password/hash.
  - duplicate username returns conflict without echoing password.
  - login success sets cookie and returns `requiresPersonaSelection`.
  - 5 failed attempts throttle the sixth attempt for the same username/IP.
  - logout revokes session and clears cookie.
  - persona selection rejects persona ids from another household.
- Middleware tests or e2e route tests cover redirects for signed out, signed in without persona, and signed in with persona.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`

**Review points:**

- Spec compliance review must focus on auth privacy, session requirements, household credential model, and no misleading per-person secrecy.
- Code quality review must focus on crypto usage, cookie flags, throttle correctness, generic errors, token hashing, and test isolation.

**Order/dependencies:**

- Depends on T02 and T03.
- T05 and all `/app/**` feature routes depend on this task.

---

### Task T05: Mobile-First App Shell, Auth UI, Persona Selection, And Onboarding

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add auth and onboarding UI`

**Owned files/directories:**

- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(auth)/create-household/page.tsx`
- Create: `src/app/(auth)/choose-persona/page.tsx`
- Create: `src/app/app/layout.tsx`
- Create: `src/app/app/home/page.tsx`
- Create: `src/app/app/onboarding/page.tsx`
- Create: `src/app/app/settings/page.tsx`
- Create: `src/components/app-shell/**`
- Create: `src/components/auth/**`
- Create: `src/components/onboarding/**`
- Create: `src/components/settings/**`
- Modify: `src/app/page.tsx`
- Add UI tests under `src/components/auth/**` and e2e tests for create/login/persona/onboarding.

**Must not touch:**

- `src/server/auth/**` and auth API route internals from T04.
- Prisma schema/repositories.
- Responsibility, radar, or check-in feature folders except links/placeholders in the app shell navigation.

**Inputs:**

- T04 auth/persona APIs.
- `docs/product/user-flows.md`.
- `src/lib/safety-copy.ts` from T02.
- `docs/product/visual-system.md`.

**Behavior requirements:**

- Build mobile-first pages for:
  - `/create-household`
  - `/login`
  - `/choose-persona`
  - `/app/onboarding`
  - `/app/home`
  - `/app/settings`
- Root `/` routes signed-out users to `/login`; signed-in users with persona go to `/app/home`; signed-in users without persona go to `/choose-persona`.
- Auth forms:
  - Never echo passwords in errors.
  - Show generic login failure text.
  - Disable submit while pending.
  - Preserve entered household name/username on recoverable errors, not password.
- Persona selection:
  - Show only Alex and Max from the API response/session.
  - Make active persona visible in the app shell.
  - Persona switch from settings requires an explicit click and confirmation screen or dialog.
- Onboarding:
  - Explain Fairplay as practical household planning, not therapy or crisis support.
  - Include the unsafe-relationship caution from `src/lib/safety-copy.ts`.
  - Show a short setup path: map responsibilities, assign ownership, add radar concerns, schedule check-in.
  - Provide skip action to `/app/home`.
  - Use original copy only.
- App shell:
  - Mobile bottom navigation or compact nav for Home, Load Map, Radar, Check-ins, Settings.
  - No decorative card/deck metaphor.
  - Accessible focus states, labels, and form errors.
- Settings:
  - Show household display name and active persona.
  - Provide logout.
  - Mention export/deletion/household exit as not available in v1 only if phrased as future data controls already identified in product docs.

**Tests/checks expected:**

- Component tests for form validation, pending state, generic auth errors, and persona choice.
- E2E flow:
  - create household -> choose persona -> onboarding -> home.
  - logout -> login -> choose persona -> home.
  - expired/cleared cookie redirects `/app/home` to `/login`.
- Accessibility check with Playwright for keyboard navigation through auth and persona screens.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/components/auth src/components/onboarding`
- Run: `npm run test:e2e -- --grep \"auth|onboarding\"`
- Run: `npm run build`

**Review points:**

- Spec compliance review must inspect every onboarding/auth/settings string for non-clinical, non-accusatory, and privacy-honest wording.
- Code quality review must inspect mobile layout, accessible forms, error handling, no sensitive browser storage, and route protection UX.

**Order/dependencies:**

- Depends on T04.
- T06 through T08 can reuse the app shell and navigation after this task.

---

### Task T06: Load Overview, Responsibility Assignment UI, And API Mutations

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add responsibilities and load map`

**Owned files/directories:**

- Create: `src/server/responsibilities/service.ts`
- Create: `src/server/responsibilities/load-snapshot.ts`
- Create: `src/app/api/responsibilities/route.ts`
- Create: `src/app/api/responsibilities/[id]/route.ts`
- Create: `src/app/api/responsibilities/[id]/assignments/route.ts`
- Create: `src/app/api/responsibilities/[id]/status/route.ts`
- Create: `src/app/api/responsibilities/[id]/radar-flag/route.ts`
- Create: `src/app/api/load-snapshot/route.ts`
- Create: `src/app/app/load-map/page.tsx`
- Create: `src/app/app/responsibilities/new/page.tsx`
- Create: `src/app/app/responsibilities/[id]/page.tsx`
- Create: `src/components/responsibilities/**`
- Add tests under `src/server/responsibilities/**`, API route tests, component tests, and e2e tests.

**Must not touch:**

- Auth internals except calling `current-session`.
- Radar UI pages except creating a radar item through the `radar-flag` API using repository/service boundaries.
- Check-in feature files.
- Seed content list from T02.

**Inputs:**

- T02 responsibility contracts and enums.
- T03 repositories.
- T04 current session helper.
- T05 app shell.
- `docs/product/user-flows.md`.

**Behavior requirements:**

- API list/detail:
  - Return only records for the active session household.
  - Include current assignments derived from assignment history.
  - Include load snapshot aggregates with no scores or winner/loser labels.
- Create/edit responsibility:
  - Accept user-authored title, summary, area keys, hidden effort keys, cadence, relevant days, status, visibility, household standard, notes, and next review date.
  - Default status to `unassigned` unless a valid assignment is included.
  - Default visibility to `shared_household`.
  - Reject private responsibility visibility unless a product review explicitly adds private responsibility drafts; v1 private draft behavior belongs to radar.
- Assignment mutation:
  - Allow accountable owner, shared owner, helper, and backup roles for Alex/Max.
  - Close prior active assignments when roles change.
  - Require handoff context and revisit date when accountable owner changes.
  - Record a neutral `ResponsibilityEvent`.
- Status mutation:
  - Support `active`, `needs_review`, `paused`, `not_relevant`, and `archived`.
  - Require confirmation for archive.
  - Keep pause/not relevant language non-shaming.
- Radar flag mutation:
  - Create a radar item with reason `review_due` or `unclear_expectation` linked to the responsibility.
  - Let user choose `private` draft or shared/check-in visibility with explicit confirmation for publishing.
- Load map UI:
  - Mobile-first responsibility list with filters for owner, status, cadence, area, hidden effort, radar flag, and review timing.
  - Summary signals: owner distribution, shared count, high-frequency count, open radar count, due review count, paused/not-relevant count, hidden effort mix, area mix.
  - Do not display a partner score, blame label, diagnosis, morality grade, or winner/loser comparison.
- Responsibility editor UI:
  - Create and edit all v1 fields.
  - Show assignment role controls for Alex and Max.
  - Show handoff/revisit prompts only when ownership changes.
  - Support pause, archive, not relevant, and flag for radar.

**Tests/checks expected:**

- Service tests:
  - create responsibility scoped to household.
  - reject cross-household reads/mutations.
  - assignment changes close old assignments and record event.
  - accountable owner changes require handoff context and revisit date.
  - load snapshot contains only aggregate fields and no score fields.
- API tests for create/edit/assign/status/radar flag.
- Component tests for filters, empty state, assignment controls, and archive confirmation.
- E2E flow:
  - create responsibility.
  - assign Alex accountable owner.
  - change to Max with handoff and revisit date.
  - pause and restore active.
  - archive with confirmation.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`
- Run: `npm run test:e2e -- --grep \"responsibility|load map\"`
- Run: `npm run build`

**Review points:**

- Spec compliance review must focus on non-punitive load signals, assignment semantics, visibility, and neutral lifecycle language.
- Code quality review must inspect household scoping, mutation validation, event consistency, responsive UI, and test coverage.

**Order/dependencies:**

- Depends on T02 through T05.
- T07 can run after this task because radar links may reference responsibilities.
- T08 depends on responsibilities for agenda suggestions and decisions.

---

### Task T07: Radar Concern Board UI And API Mutations

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add radar board`

**Owned files/directories:**

- Create: `src/server/radar/service.ts`
- Create: `src/app/api/radar/route.ts`
- Create: `src/app/api/radar/[id]/route.ts`
- Create: `src/app/api/radar/[id]/publish/route.ts`
- Create: `src/app/api/radar/[id]/defer/route.ts`
- Create: `src/app/api/radar/[id]/resolve/route.ts`
- Create: `src/app/api/radar/[id]/schedule/route.ts`
- Create: `src/app/app/radar/page.tsx`
- Create: `src/components/radar/**`
- Add tests under `src/server/radar/**`, API route tests, component tests, and e2e tests.

**Must not touch:**

- Responsibility editor internals except consuming linked responsibility summaries through existing APIs/services.
- Check-in feature files except setting `targetCheckInId` through repository/service boundaries.
- Auth internals.

**Inputs:**

- T02 radar contracts and safety copy.
- T03 repositories.
- T04 current session helper.
- T05 app shell.
- T06 responsibility summaries.
- `docs/product/user-flows.md`.
- `docs/product/ip-safety-review.md`.

**Behavior requirements:**

- API list/detail:
  - Return shared household, partner-visible, check-in-only, and selected-persona private drafts according to visibility rules.
  - Never return another persona's private drafts in persona-filtered views.
  - Do not imply private drafts are secret from someone who controls the shared login; use honest product copy.
- Create/update radar item:
  - Fields: topic, optional notes, optional linked responsibility, reason key, urgency, desired timing, visibility.
  - Default state `draft` for `private`; default state `open` for confirmed shared/partner/check-in visibility.
  - Require explicit confirmation when publishing a private draft to `shared_household`, `partner_visible`, or `check_in_only`.
- Publish/defer/resolve/schedule:
  - Publish changes visibility and state only with confirmation.
  - Defer sets state `deferred` with optional revisit date.
  - Resolve sets `resolvedAt`.
  - Schedule attaches the item to a check-in or marks it ready for check-in.
- Radar UI:
  - Mobile-first board with sections for private drafts, shared/open items, check-in topics, deferred/resolved filters.
  - Visibility labels must be visible on every item.
  - Use neutral reason labels: unclear expectation, blocked, too much, handoff needed, review due, other.
  - Provide create, edit, publish, defer, resolve, dismiss, and schedule actions.
  - Publishing private drafts must show a confirmation that names the new visibility.
  - Do not use complaint/proof/failure/blame labels.

**Tests/checks expected:**

- Service tests:
  - selected persona sees own private drafts and shared items.
  - selected persona does not see the other persona's private drafts in default radar list.
  - publish requires confirmation.
  - defer and resolve update state and timestamps.
  - cross-household access is rejected.
- API tests for list/create/update/publish/defer/resolve/schedule.
- Component tests for visibility labels and publish confirmation.
- E2E flow:
  - create private draft.
  - verify it appears under private drafts.
  - publish to check-in-only with confirmation.
  - defer it.
  - resolve it.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/server/radar src/components/radar src/app/api/radar`
- Run: `npm run test:e2e -- --grep \"radar\"`
- Run: `npm run build`

**Review points:**

- Spec compliance review must focus on explicit visibility, private draft confirmation, non-blaming concern language, and no unsafe-confrontation prompts.
- Code quality review must inspect access control, state transitions, UI confirmations, and tests around persona filtering.

**Order/dependencies:**

- Depends on T02 through T06.
- T08 depends on radar agenda sources.

---

### Task T08: Guided Check-In UI, Decisions, And Persisted Summaries

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: add guided check-ins`

**Owned files/directories:**

- Create: `src/server/check-ins/agenda.ts`
- Create: `src/server/check-ins/service.ts`
- Create: `src/server/check-ins/summary.ts`
- Create: `src/app/api/check-ins/route.ts`
- Create: `src/app/api/check-ins/[id]/route.ts`
- Create: `src/app/api/check-ins/[id]/items/[itemId]/route.ts`
- Create: `src/app/api/check-ins/[id]/decisions/route.ts`
- Create: `src/app/api/check-ins/[id]/complete/route.ts`
- Create: `src/app/app/check-ins/new/page.tsx`
- Create: `src/app/app/check-ins/[id]/page.tsx`
- Create: `src/components/check-ins/**`
- Add tests under `src/server/check-ins/**`, API route tests, component tests, and e2e tests.

**Must not touch:**

- Auth internals.
- Prisma schema unless a blocker is found and approved by the controller.
- Radar or responsibility service internals except calling their public service/repository methods for explicit decisions.

**Inputs:**

- T02 check-in contracts and safety copy.
- T03 repositories.
- T04 current session helper.
- T06 responsibilities.
- T07 radar.
- `docs/product/user-flows.md`.
- `docs/product/ip-safety-review.md`.

**Behavior requirements:**

- Agenda creation:
  - Suggest a short agenda from open radar items, due reviews, recent responsibility changes, and optional appreciation/acknowledgement.
  - Keep agenda short: default maximum 5 items.
  - Allow users to remove or skip any suggested item.
- Check-in state:
  - Create check-ins in `draft` or `active`.
  - Resume active check-ins.
  - Complete check-ins with factual summary.
  - Support item states `queued`, `discussed`, `deferred`, and `skipped`.
- Decision capture:
  - Decision types from T02 only.
  - Decisions may update responsibility owner, role, cadence, status, household standard, visibility, or review date only through explicit user action.
  - Decisions record `createdByPersonaId`, effective date, optional review date, and neutral summary.
  - Deferred or skipped items are not failures.
- Summary:
  - Persist a calm decision-focused summary of decisions, deferred topics, and next review dates.
  - Avoid grievance archive framing, accusations, clinical advice, or score-like language.
- UI:
  - Mobile-first stepper or compact guided flow.
  - Show current item, skip/defer controls, decision form, and completion summary.
  - Make pause/defer normal and easy.
  - Preserve visibility labels for radar items.

**Tests/checks expected:**

- Service tests:
  - agenda includes open radar and due reviews, capped at 5.
  - skip/defer updates item state without creating decision.
  - decision updates responsibility only through explicit decision route.
  - complete check-in persists summary and timestamps.
  - cross-household access is rejected.
  - summary text does not contain score/winner/loser/diagnosis labels.
- API tests for create/resume/item update/decision/complete.
- Component tests for agenda selection, skip/defer controls, decision form, and summary.
- E2E flow:
  - create responsibility and radar item.
  - start check-in.
  - discuss one item and defer one item.
  - record owner/review-date decision.
  - complete and view persisted summary.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/server/check-ins src/components/check-ins src/app/api/check-ins`
- Run: `npm run test:e2e -- --grep \"check-in\"`
- Run: `npm run build`

**Review points:**

- Spec compliance review must focus on check-in safety, defer/skip affordances, factual summaries, and explicit decision updates.
- Code quality review must inspect state machine correctness, transactional updates, access control, and e2e coverage.

**Order/dependencies:**

- Depends on T02 through T07.

---

### Task T09: Visual Assets And Motion Integration

**Expected branch/commit scope:** `codex/v1-app`, commit `feat: integrate Fairplay visuals`

**Owned files/directories:**

- Create: `public/assets/fairplay/**` only with assets supplied or approved by the visual agent.
- Create: `src/components/visuals/**`
- Create: `src/components/motion/**`
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.*`
- Modify feature components only to replace placeholders with approved visual components:
  - `src/components/app-shell/**`
  - `src/components/onboarding/**`
  - `src/components/responsibilities/**`
  - `src/components/radar/**`
  - `src/components/check-ins/**`

**Must not touch:**

- Auth/session/server logic.
- Prisma schema/repositories.
- Domain enum/contract names.
- Any private reference assets or source-derived visuals.

**Inputs:**

- A completed visual-agent handoff under `docs/agents/tasks/**/handoff.md` that explicitly approves original assets/direction for Fairplay.
- Approved assets committed or provided for `public/assets/fairplay/**`.
- `docs/product/visual-system.md`.
- `docs/product/ip-safety-review.md`.

**Behavior requirements:**

- If either the visual-agent handoff or the approved asset set is absent, stop and report `NEEDS_CONTEXT` to the controller. Do not invent character art in this task.
- Integrate original Alex/Max character or household illustrations only if approved as original and not source-derived.
- Add lightweight animations for transitions, check-in progress, empty states, and success states.
- Respect reduced-motion preferences with `prefers-reduced-motion`.
- Keep visuals supportive and calm; avoid deck/card-game metaphors, source-like printed cards, source iconography, or copied public app art.
- Keep dense operational screens scanable; visual elements must not obscure forms, lists, controls, or state labels.
- Use accessible alt text for meaningful images and empty alt text for decorative images.

**Tests/checks expected:**

- Component tests confirm visual components render with accessible labels or decorative empty alt text.
- E2E visual smoke tests at mobile and desktop widths:
  - `/app/onboarding`
  - `/app/home`
  - `/app/load-map`
  - `/app/radar`
  - `/app/check-ins/new`
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run src/components/visuals src/components/motion`
- Run: `npm run test:e2e -- --grep \"visual|responsive\"`
- Run: `npm run build`

**Review points:**

- Spec compliance review must verify visual originality, no source-derived art, no deck metaphor, and safety-compatible tone.
- Code quality review must inspect responsive layout, reduced-motion handling, asset loading, alt text, and no layout overlap.

**Order/dependencies:**

- Depends on T05 through T08 for integration targets.
- Also depends on a visual-agent handoff. Without that handoff, this task is blocked by design context, not by code.

---

### Task T10: README Deployment Instructions And Vercel Readiness

**Expected branch/commit scope:** `codex/v1-app`, commit `docs: add deployment and Vercel readiness notes`

**Owned files/directories:**

- Modify: `README.md`
- Modify: `.env.example`
- Create/modify: `vercel.json` only when the app needs non-default Vercel runtime or build configuration; otherwise leave it absent and record that default Vercel behavior is intentional in the PR notes.
- Create: `docs/deployment/vercel.md`
- Create: `docs/deployment/local-development.md`

**Must not touch:**

- Feature implementation files under `src/server/**`, `src/app/**`, `src/components/**`, or `prisma/schema.prisma` unless a documented command is missing and the owning worker approves the small change.

**Inputs:**

- T01 scaffold scripts.
- T03 database setup.
- T04 auth/session environment variables.
- All feature tasks for current route list and verification commands.
- `README.md`.
- `docs/superpowers/specs/2026-05-04-fairplay-v1-design.md`.

**Behavior requirements:**

- README must cover:
  - Node.js 20.9 or newer.
  - Install command.
  - Local development command.
  - Test, lint, typecheck, build, Prisma, and Playwright commands.
  - Environment variables configured outside source.
  - Vercel Marketplace Postgres-compatible storage connection through `DATABASE_URL`.
  - Prisma generate/migrate/seed commands.
  - Password/session secret setup.
  - Cookie security expectations.
  - Vercel deploy flow.
  - Local Postgres verification with Docker Compose.
- `.env.example` must include placeholders only and must not contain real secrets.
- Deployment docs must state that Vercel environment variables should be configured in project settings and encrypted at rest by Vercel.
- Deployment docs must state no private reference materials, plaintext passwords, seed real household records, or local env files may be committed.
- Add a Vercel readiness checklist:
  - `npm run lint`
  - `npm run typecheck`
  - `npm test -- --run`
  - `npm run test:e2e`
  - `npm run build`
  - `npm run prisma:validate`
  - migration command against the selected database.

**Tests/checks expected:**

- Run all commands documented in README that do not require cloud credentials.
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run`
- Run: `npm run build`
- Run: `npm run prisma:validate`
- Manually inspect docs for secrets and source-reference leakage.

**Review points:**

- Spec compliance review must verify deployment docs include required README notes and preserve privacy/IP boundaries.
- Code quality review must verify documented commands match actual package scripts and Vercel configuration is minimal and correct.

**Order/dependencies:**

- Depends on T01, T03, T04, and preferably T06 through T08 so documented routes/features match the app.
- Can run before T09 if visual work is blocked.

---

### Task T11: Final Verification, Release Candidate Review, And Draft PR

**Expected branch/commit scope:** `codex/v1-app`, commit `test: verify Fairplay v1 release candidate` only if verification docs or test snapshots are updated; otherwise no commit required.

**Owned files/directories:**

- No production source ownership by default.
- May create/modify: `docs/deployment/release-checklist.md` if the controller wants a recorded verification artifact.
- May update README only for discovered command corrections approved by the owning docs worker.

**Must not touch:**

- Production app code to "quick fix" failures. If verification fails, assign the failure back to the owning task worker or create a focused fix task.

**Inputs:**

- Completed T01 through T10.
- All spec compliance and code quality review results.

**Behavior requirements:**

- Verify the full app story end to end:
  - Create household.
  - Choose Alex.
  - Complete or skip onboarding.
  - Create responsibility.
  - Assign owner and review date.
  - Create private radar draft.
  - Publish radar item with confirmation.
  - Start check-in.
  - Defer one item and decide one item.
  - Complete check-in and confirm persisted summary.
  - Logout and login again.
  - Choose Max and confirm shared household state.
- Confirm security/privacy basics:
  - Password hash only in database.
  - No plaintext password in logs, responses, or seed data.
  - Session cookie is `HttpOnly`, `Secure` in production, and `SameSite=Lax`.
  - `localStorage` contains no household data, drafts, concern details, or secrets.
  - Cross-household API access is rejected.
- Confirm IP/safety basics:
  - No full starter catalog.
  - No copied source labels or source-like category system.
  - No partner score, morality grade, diagnosis, winner/loser view, or confrontation prompt.
  - Private draft publishing requires confirmation.
  - Check-in allows skip/defer.

**Tests/checks expected:**

- Run: `git status --short`
- Run: `npm run lint`
- Run: `npm run typecheck`
- Run: `npm test -- --run`
- Run: `npm run test:e2e`
- Run: `npm run prisma:validate`
- Run: `npm run build`
- Run local app and complete manual browser verification at mobile and desktop widths.
- Inspect browser devtools storage and cookies during manual verification.
- Search for blocked terms and risky labels:
  - `rg -n "score|winner|loser|diagnos|therapy|crisis|bad partner|proof|deck|card game|worksheet|assessment" src README.md docs`
  - Any legitimate matches must be in safety/disclaimer context, not product scoring or source-derived UI.

**Review points:**

- Spec compliance review must run after final verification and before draft PR is marked ready for broader review.
- Code quality review must run after spec compliance issues are fixed.
- Draft PR description must include verification command results and known residual risks.

**Order/dependencies:**

- Runs after all implementation tasks and blocking reviews are complete.

---

## PR Strategy

### Docs/Spec PR

- Source branch: `codex/research-and-spec`
- Target branch: `main`
- Purpose: land product architecture, safety/IP review, data model, user flows, and this implementation plan.
- Expected validation:
  - Docs diff only.
  - Review confirms no private reference text/assets are committed.
  - Review confirms implementation plan honors the design spec, v1 scope, data model, and IP/privacy/safety guardrails.

### Implementation PR

- Branch: `codex/v1-app`
- Base:
  - Prefer updated `main` after the docs/spec PR merges.
  - If implementation begins before docs merge, branch from `codex/research-and-spec` and rebase onto `main` after docs merge.
- PR state: open as draft after T01 or T03 so CI and reviewers can track incremental work.
- Draft PR expectations:
  - Keep task ids in commit messages or PR checklist.
  - Include a checklist for T01 through T11.
  - Link the docs/spec PR.
  - List environment variables with placeholder names only.
  - Record which spec compliance and code quality reviews have passed.
- Ready-for-review expectations:
  - T01 through T10 complete or explicitly deferred with controller approval.
  - T11 final verification complete.
  - All tests/checks listed in T11 pass or failures are documented with exact command output and owner.
  - No production secrets, private reference materials, plaintext passwords, source-derived content, or sensitive offline caching.

## Controller Review Gates

- Gate A after T03: database/auth foundation is ready for sensitive API work.
- Gate B after T05: auth UI/onboarding copy is safe before feature surfaces add more user-facing relationship-support copy.
- Gate C after T08: full core product path is implemented before visual polish and deployment docs.
- Gate D after T11: release candidate is ready for non-draft PR review or deploy preview.
