# Fairplay Context Log

## 2026-07-16 - Performance, Bundle, And Asset Efficiency

Requested by the user as milestone 4 of the Fairplay Improvement Program: reduce repeated server/client work, split large modules, optimize artwork, and defer Little Alex physics without changing product behavior.

Actions completed:

- Added an additive household catalog-version marker and current-assignment-only overview query while retaining full responsibility details/history.
- Memoized session resolution per React server request and limited conditional `lastSeenAt` writes to one per five minutes.
- Split Board, Deal, and Your Deck into route-specific client entries with shared card presentation and pure transition helpers.
- Deferred Matter.js until a desktop fine-pointer media query matches and paused physics outside active movement or while hidden.
- Generated 36 local AVIF/WebP background variants, restored local card-cover optimization, and migrated every active generated page background to the responsive layer.
- Split global CSS into ordered theme, shell/background, motion, Little Alex, and reduced-motion concerns.
- Added a mobile production-network gate for responsive art, optimized covers, bounded Available Cards DOM, and absence of Matter.js requests.
- Updated current context/wiki/implementation documentation. No API keys, live AI calls, or private reference material were used.

Verification:

- `npm run db:wait`
- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run prisma:migrate -- --skip-seed`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run --maxWorkers=4` (106 files / 637 tests)
- `npm run build`
- `npx playwright test --project=chromium --workers=1` (31 tests)

## 2026-05-10 - Security Scan Hardening Pass

Requested by the user: run the Codex Security scan on the codebase and make necessary changes without breaking app functionality. CodeRabbit was initially requested, but the user later asked to ignore the CodeRabbit part.

Actions completed:

- Ran a bounded repository-wide high-impact security pass over auth/session, middleware, tenant scoping, AI provider boundaries, browser storage, unsafe rendering, raw query/process/file sinks, and dependency advisories.
- Wrote scan artifacts under `/tmp/codex-security-scans/Fairplay/7f3ae25b147d_20260510T135638Z/`.
- Removed middleware's host-derived self-fetch to `/api/auth/me` so raw cookies are no longer forwarded to a URL built from inbound request metadata; authoritative session/persona enforcement remains in the protected app layout.
- Added middleware regression coverage asserting signed-in app requests continue without calling `fetch`.
- Forced `postcss@8.5.14` via package pin and npm override so the nested vulnerable PostCSS copy under Next is removed and `npm audit` is clean.

Verification:

- `npm test -- src/middleware.test.ts --run`
- `npm audit --json`
- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`

## 2026-05-10 - Little Alex Hair Layer Physics Sync

Requested by the user after visual review: regenerated Little Alex hair assets stayed pinned near the bottom-right screen area, and custom hair color appeared during ragdoll but reverted to default hair when Little Alex settled.

Actions completed:

- Added the full-body hair sprite layer to the same imperative Matter.js DOM sync path as the full-body character sprite.
- Synced full-body hair layer opacity through settled, flinging, and recovering visual states.
- Added focused regression coverage that drags Little Alex in physics mode and requires the full-body hair layer transform and opacity to match the body sprite.

Verification:

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
- `npm run typecheck`
- `npm run lint`
- `git diff --check`

## 2026-05-09 - Little Alex Default Help Phrase

Requested by the user: change the default Little Alex chat bubble text to "Help!" and keep local and GitHub on the same commit.

Actions completed:

- Updated the Little Alex contract default and component fallback chat phrase to `Help!`.
- Updated the Prisma schema default and added a migration that also moves existing rows still using the old default phrase to `Help!`.
- Updated focused contract, repository, API, Settings, component, and Playwright expectations for the new default phrase.

Verification:

- Red test confirmed the old contract default failed against the new `Help!` expectation.
- `npm test -- --run src/contracts/preferences.test.ts src/server/repositories/preferences.test.ts src/app/api/preferences/little-alex/route.test.ts src/components/settings/settings-panel.test.tsx src/components/little-alex/little-alex-physics.test.tsx`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run prisma:migrate -- --skip-seed`
- `git diff --check`

## 2026-05-08 - Little Alex Hair Recolor Correction

Requested by the user after visual review: the Little Alex hair color setting must actually recolor the sprite hair, not add a colored blob over the head.

Actions completed:

- Replaced the CSS hair-overlay DOM/CSS with generated transparent PNG hair layers aligned to the full-body and ragdoll head sprites.
- Added deterministic hair-layer asset generation for all Little Alex gender presentations and configured hair colors.
- Added regression coverage that requires the sprite-derived hair assets and asserts the old overlay nodes are gone.
- Rechecked generated full/head composites for neutral, masculine, and feminine Little Alex variants.

Verification:

- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run src/components/little-alex/little-alex-physics.test.tsx src/server/ai/little-alex-sprite-assets.test.ts`
- `npm test -- --run`
- `npm run build`
- `npm run test:e2e` (28 Playwright tests)
- Rendered Playwright spot check saved Auburn hair and confirmed `little-alex-full-hair-sprite` used `/assets/fairplay/little-alex-sprites/neutral-auburn-full-hair.png` with zero old hair-overlay nodes.

## 2026-05-08 - Desktop Layout And Learn Cleanup

Requested by the user: polish Ask Greg and Board desktop responsive layouts, add short subtitles for Your Deck and Board, and remove the old "Learn this feature" dummy onboarding workflow without disturbing mobile layouts.

Actions completed:

- Rebuilt Ask Greg as one cohesive desktop panel with a larger Greg asset, tighter copy/action/draft spacing, and mobile-safe packing.
- Reworked Board so Alex and Max are the primary lanes, while Save for Later and Not Applicable are secondary and responsive.
- Restyled Board cards to match the quality of Your Deck cards more closely.
- Added concise subtitles to Your Deck and Board.
- Removed active feature-guide launcher/tour/practice components, dummy Library/Settings workflows, guide markers, and the onboarding-preview AI route.
- Removed obsolete feature-guide entries from the generated UI asset registry.
- Removed unused Load Map component/lane metadata files while preserving `/app/load-map` as a Board redirect.
- Fixed Little Alex stacking above page content so the desktop helper remains draggable in reduced-motion mode.
- Added implementation notes in `docs/implementation/2026-05-08-desktop-layout-learn-cleanup.md`.

Verification:

- `git diff --check`
- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run` (84 files, 493 tests)
- `npm run build`
- `npx playwright test e2e/little-alex-physics.spec.ts --project=chromium --grep "uses a static draggable-safe mode with reduced motion"`
- `npm run test:e2e` (28 Playwright tests)
- Rendered Playwright QA at 1440px, 1024px, 390px, and 320px widths for Ask Greg/Board plus retired guide checks for Library/Settings.

## 2026-05-08 - Mobile UX Card Workflow Fix

Requested by the user: stop forcing Little Alex on mobile, fix Ask Greg mobile width/readability, move Deal gesture instructions, add Deal Undo, make mobile card gestures safer, make Fogging Estandards editable and persistent, and prevent clipped card detail text.

Actions completed:

- Made Little Alex render only on desktop pointer layouts and added a compact Settings mobile note explaining desktop availability.
- Reworked Deal touch intent so page scrolling wins unless a card swipe clearly crosses movement and direction-dominance thresholds.
- Moved Deal gesture instructions under search, added last-action Undo, and kept button/keyboard actions intact.
- Tightened Ask Greg mobile containers, draft/review surfaces, inputs, and button wrapping to avoid horizontal overflow.
- Made card detail Fogging Estandards editable via `householdStandard`, with wrapped purpose/standards text and persisted navigation-back verification.
- Updated e2e expectations, product/helper docs, wiki, decisions, and implementation notes for the desktop-only Little Alex and safer Deal gesture model.

Verification:

- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e` (28 Playwright tests)
- `npm test -- --run` (90 files, 549 tests)
- Rendered browser QA at desktop and 320px mobile, plus a Chromium CDP touch-input probe for mobile Deal scroll safety and intentional horizontal swipe/Undo.

## 2026-05-08 - Local E2E And Prisma Stability

Requested by the user: fix the test server flakiness and local DB permission issues so they do not block the next pass.

Actions completed:

- Replaced Playwright's flaky `next dev --port 3101` server with build-plus-`next start --port 3101`.
- Added explicit Playwright web-server env for `APP_BASE_URL`, `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `SESSION_SECRET`.
- Added `SHADOW_DATABASE_URL` to Prisma schema/env examples and npm Prisma scripts.
- Added `npm run db:shadow`, backed by `scripts/db/ensure-shadow-db.mjs`, to create/check the local Prisma shadow database before `migrate dev`.
- Added Docker init SQL so fresh Compose volumes create `fairplay_shadow` alongside the app database.
- Added developer-tooling regression tests for the e2e server and shadow DB configuration.
- Hardened two Little Alex Playwright assertions that were flaking due async drag timing, page animation noise in screenshot diffs, and subpixel viewport rounding.
- Added implementation documentation in `docs/implementation/2026-05-08-e2e-prisma-local-stability.md`.

Verification:

- `git diff --check`
- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` (90 files, 540 tests)
- `npm run prisma:migrate -- --skip-seed`
- `npm run test:e2e` (28 tests)

## 2026-05-08 - Catalog Deal Board And Little Alex Fix

Requested by the user: make Library and Deal represent the same underlying card catalog, remove Library put-in-play and Board Unassigned, prevent duplicate catalog cards, normalize existing local/dev duplicate data safely, and fix Little Alex mobile grab/drag/fling behavior without unrelated UI changes.

Actions completed:

- Materialized the full Fairplay source-card catalog into one active household responsibility per source template before responsibility overview reads.
- Added safe duplicate cleanup that archives duplicate active rows by `templateId`, plus a partial unique index on active `(householdId, templateId)` rows.
- Preserved distinct real source cards with similar titles by deduping on stable template identity rather than card title.
- Removed visible Library put-in-play/lane-selection controls and updated Library guide/practice expectations.
- Kept Deal search and one-by-one browsing backed by the full catalog-derived dealable pool.
- Removed the Board Unassigned section and kept remove-from-board behavior only for Alex, Max, Save for later, and Not applicable categories.
- Separated Little Alex touch grab/drag state from ragdoll state, including pointer capture, touch cancellation, release velocity, and mobile/desktop regression coverage.
- Added implementation documentation in `docs/implementation/2026-05-08-catalog-deal-board-little-alex.md`.

Verification:

- `npm run prisma:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --run` (89 files, 538 tests)
- `npm run build`
- Targeted Playwright for corrective responsive, Little Alex physics, guided learning, and auth-onboarding.
- Full `npm run test:e2e -- --workers=1` (28 tests).
- Local migration deploy applied `20260508120000_catalog_card_identity`; `prisma migrate dev --skip-seed` was blocked by local shadow DB permission `P3014`.

## 2026-05-08 - Deal And Deck Naming Polish

Requested by the user: consider calling Distribute "Deal" as in dealing cards, and Your Cards "Your Deck."

Actions completed:

- Updated the primary app-shell tab labels to Your Deck and Deal while keeping stable routes `/app/your-cards` and `/app/distribute`.
- Updated Deal/Your Deck headings, search labels, empty states, onboarding/settings/crash-course links, and related tests.
- Updated current project memory/wiki/product docs to describe the new visible labels without changing route or data-model names.

Verification:

- Focused Vitest passed: app shell, card workspace, crash-course flow, settings panel, and persistent welcome suites.
- `npm run typecheck` and `npm run lint` passed.
- Targeted Playwright passed for the affected auth/onboarding, guided-learning, dark-mode, corrective responsive, and Little Alex nav specs: 20 tests.

## 2026-05-08 - Focused Patch Run

Requested by the user: patch only the Distribute availability bug, the mobile More menu, and Little Alex intentional drag behavior; avoid broad Home/Board/Greg redesign; use subagents and separate branches where possible; merge fixes through ordered PRs; and confirm local/GitHub main alignment.

Actions completed:

- Merged PR #42 to keep the active Distribute card visible while a server move is pending and preserve remaining cards until they are assigned to Alex, Max, Saved for Later, or Not Applicable.
- Merged PR #44 to make the More menu a controlled visible menu with Check-in, Settings, Theory, and Card Library links, fixed mobile placement, and an outside-tap dismiss layer.
- Merged PR #43 to add Little Alex touch-intent gates, pointer-capture-safe drag activation, scroll cancellation, and helper-system documentation.
- Final rendered QA found and fixed leftover More-menu browser issues: a stale `[open]` CSS rule hid the controlled panel, bottom-nav blur constrained fixed overlay geometry, and pointerdown dismissal allowed click-through navigation.
- Added implementation/QA documentation at `docs/implementation/2026-05-08-focused-patch-run.md`.

Verification:

- Baseline `npm test -- --run` passed on main before patching: 89 files, 517 tests.
- PR #42 focused Vitest, typecheck, and lint passed.
- PR #44 focused Vitest, typecheck, and lint passed.
- PR #43 focused Vitest, typecheck, and lint passed.
- Final integrated verification passed after rendered QA follow-up: Prisma validate, typecheck, lint, full Vitest (89 files, 520 tests), build, full Playwright e2e (27 tests), and rendered QA for Distribute, More, and Little Alex.

## 2026-05-08 - Mobile Card UI And State Fix Pass

Requested by the user: make the app revolve around the real Library card images across Distribute, Your Cards, and Board; fix mobile layout overflow; move the mobile Library overflow action to the bottom; remove the unnecessary welcome banner; make Little Alex grabbable on mobile; verify state movement across tabs; and use ordered sub-agent/PR workflow.

Actions completed:

- Merged PR #38 to expose `sourceCoverAssetPath` in responsibility summaries and add distribution state coverage.
- Merged PR #39 to move mobile overflow into the bottom navigation, constrain app/page shell width, remove the protected-app welcome banner surface, remove Settings welcome replay, and add touch fallback dragging for Little Alex.
- Merged PR #40 to redesign Distribute, Your Cards, and Board around image-first card components while keeping existing card-state helpers and server actions.
- Added implementation documentation at `docs/implementation/2026-05-08-mobile-card-ui-state-fix.md`.
- Updated project memory/wiki/product docs to reflect the current card-first mobile behavior and retired welcome surface.

Verification:

- PR #38: focused responsibility/contract/repository suites, full Vitest, typecheck, and lint.
- PR #39: focused app-shell, guide, Settings, Little Alex, and distribution suites; full Vitest before merge; typecheck and lint.
- PR #40: focused card-workspace/distribution/shell/Little Alex suites, full Vitest, typecheck, and lint.
- Final integrated build/e2e/mobile smoke recorded in the implementation doc: Prisma validate, typecheck, lint, full Vitest, build, targeted responsive Playwright, and full Playwright all passed.
- Playwright QA caught and this pass fixed closed mobile overflow panel geometry overlapping Little Alex checks and duplicate fallback cover title text in compact Board cards.

## 2026-05-08 - Card-First Mobile Rebuild

Requested by the user: rebuild Fairplay as a polished mobile-first card responsibility app centered on swipe distribution, Your Cards, Board, Ask Greg, PWA/mobile safe areas, and simplified flip-card details.

Actions completed:

- Retired the homepage by redirecting `/app` and `/app/home` to Distribute.
- Added primary tabs: Your Cards, Distribute, Board, and Ask Greg, with Check-in, Theory, Settings, and Card Library behind overflow navigation.
- Added `CardWorkspace` and `card-state` mapping for normalized buckets over stable persisted lanes.
- Implemented Distribute search, card flip, swipe/arrow/button assignment, natural removal, and empty states.
- Implemented Your Cards as a card-file view with tap/click flip to assignment, purpose, and Fogging E-Standards.
- Implemented Board as grouped card buckets.
- Simplified card detail and Library card backs to purpose, Fogging E-Standards, and lane assignment only.
- Added PWA icons, manifest fields, viewport-fit cover, safe-area layout variables, and bottom-nav safe-area padding.
- Updated e2e specs from Home/Load Map expectations to the card-first flow.

Verification:

- `npm test -- --run`: 88 files, 510 tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `DATABASE_URL=... SESSION_SECRET=... npm run test:e2e`: 27 tests passed.
- Production iPhone 14 Playwright smoke passed for real auth, API-created cards, search, flip, Alex fallback button, touch swipe right to Max, Your Cards, Board, no document horizontal overflow, and PWA manifest fields.

## 2026-05-08 - Ordered App UX Polish

Requested by the user: reduce text overload, strengthen backgrounds, simplify workflows, polish Home/Load Map/Library/Check-ins/Crash Course/Settings, and merge the fixes through ordered PRs.

Actions completed so far:

- Merged UX foundation/background/copy, Load Map dashboard polish, Library/card practice polish, and lightweight Check-ins through PRs #32-#35.
- Strengthened generated backgrounds and theme-aware washes across the app shell and page hero surfaces.
- Shortened Home, Settings, Load Map, Library, Check-ins, card practice, and feature guide copy.
- Replaced the visible Check-ins workflow with scheduling, confirming that the check-in happened, and optional notes/minutes.
- Reworked Library card containment and replaced the six-tile move action with a compact destination control.
- Rewrote the Crash Course into concise concept-first storyboard frames with the app learning path only at the end.
- Updated current memory/wiki/product docs to reflect lightweight Check-ins and the final Crash Course polish.

Verification so far:

- Focused unit/component suites passed on the completed branches.
- Current Crash Course focused suite passed: 2 files, 12 tests.
- Full lint, typecheck, Vitest, build, and responsive browser QA are still part of the final merge pass.

## 2026-05-07 - Learn This Feature Onboarding Fixes

Requested by the user: fix the Learn this feature onboarding workflows across Load Map, Library, Check-ins, and Settings using controller/worker subagents and focused branches.

Actions completed:

- Fixed the shared guide overlay so the explanation card is dynamically placed within the viewport and portaled above feature layouts.
- Fixed Settings guide startup so Settings launches the Settings-specific flow rather than Load Map.
- Clarified Check-ins dummy onboarding copy and action order.
- Added a temporary Library onboarding preview route that uses the learner's dummy request and does not persist a real card.
- Added reset events so dummy onboarding UI is removed on guide skip, completion, dismissal, or unmount.
- Added inline pointer/arrow callouts for the next required dummy action across Load Map, Library, Check-ins, and Settings.
- Left Crash Course unchanged.
- Added implementation documentation in `docs/implementation/2026-05-07-learn-feature-onboarding.md`.

Branches and PRs:

- `codex/onboarding-overlay-positioning`, PR #24.
- `codex/onboarding-settings-checkins-flow`, PR #25.
- `codex/onboarding-library-draft-generation`, PR #26.
- `codex/onboarding-dummy-cleanup`, PR #27.
- `codex/onboarding-click-guidance`, PR #28.

Verification:

- Focused Vitest suites passed on each implementation branch.
- `npm run typecheck` and `npm run lint` passed on each implementation branch.
- PR #28 Vercel preview failed before build because Prisma could not reach `db.prisma.io:5432` (`P1001`); the failure was documented on the PR and local validation passed.

## 2026-05-08 - Focused Patch: Little Alex, Deal State, Board Removal, Check-in History

Requested by the user: keep the existing FairPlay UI/behavior, pull latest main, investigate mobile Little Alex, fix swapped ragdoll hand assets, repair Deal/Library/Board card state, add Board removal, clean up Check-in scheduling, and persist Check-in history.

Actions completed:

- Confirmed local `main` and `origin/main` started on commit `4b7c580e3244f525188ff471eab88cd3ba8fc9c3`.
- Fixed Little Alex mobile grab alignment by keeping the grab overlay synced to the responsive sprite geometry, enlarging the mobile touch target, and exposing pending/dragging state for hold interactions.
- Corrected Little Alex ragdoll hand asset mapping without changing physics or assets.
- Normalized product card buckets through `bucketForCard`, including legacy active unowned `not_in_play` records as unclassified.
- Added `unassigned` distribution support so Board cards can be removed back to Deal/Library.
- Added a Library "Cards ready to deal" shelf backed by the same unclassified responsibility pool as Deal.
- Removed the visible Check-in guide launcher, split scheduling into consistent date/time pickers, and added persisted Check-in history rows.
- Updated Playwright coverage for real Check-in persistence, Board removal returning to Deal/Library, and corrected Little Alex sprite mapping.
- Documented findings, assumptions, QA steps, and state model changes in `docs/implementation/2026-05-08-focused-patch-alex-deal-checkins.md`.

Verification:

- `npm run prisma:validate`
- `npm run prisma:generate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run` (89 files / 530 tests)
- `npm run build`
- `npx playwright test e2e/check-in.spec.ts e2e/corrective-responsive-visual.spec.ts --project=chromium`
- `npx playwright test e2e/little-alex-physics.spec.ts --project=chromium`
- `npm run test:e2e` (28 tests)

## 2026-05-07 - Crash Course Storyboard Refresh

Requested by the user: put the crash-course storyboard and course text close together, make the text read like subtitles for the images, break the course into more parts, and generate new Qwen images that follow the course text.

Actions completed:

- Reworked the crash course from 5 long lessons into 14 short storyboard frames.
- Updated the crash-course UI so the image and subtitle-style course text live in the same framed stage, with storyboard number tabs and previous/next/finish controls nearby.
- Generated 14 new Qwen crash-course PNGs under `public/assets/fairplay/generated-ui/crash-course/`.
- Tightened generated UI prompts to treat crash-course art as silent storyboard frames with no labels, captions, UI text, readable text, or pseudo-writing.
- Preserved desktop right padding on the immersive route so Little Alex does not overlap subtitle controls.

Verification:

- `npm run assets:generate-ui -- --skip-existing --delay-ms=0`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`
- `npx playwright test e2e/corrective-responsive-visual.spec.ts --project=chromium --grep "captures real app pages across responsive viewport sizes"`

## 2026-05-07 - Board Lane Compatibility Decision

Requested by the user: use the recommended board lane path before opening the PR to main.

Actions completed:

- Kept `ResponsibilityBoardLane` enum/API/database values stable.
- Documented that `cards_of_concern`, `player_1`, `player_2`, and `kid_split` are persisted keys with UI label mapping.
- Marked any future board lane rename as a separate compatibility migration rather than part of the Radar cleanup.

## 2026-05-07 - Radar Removal Documentation Update

Requested by the user: update active project documentation only, within the approved docs scope, so current architecture and data-model docs reflect that the Radar backend/API/model/assets were removed in the cleanup pass.

Actions completed:

- Rewrote current-state memory/wiki/data-model/deployment references so Radar is no longer documented as an active product area, API, service, contract, Prisma model, load-snapshot metric, or generated asset set.
- Left only historical/removal references where they explain the cleanup or existing migration history.
- After implementation, applied the removal migration locally and verified the DB-backed repository suite through the full Vitest run.

## 2026-05-07 - Repo Index And Memory Bootstrap

Requested by the user: use the memory/context skill pack on the existing project, index the haphazard repo before feature changes, create standard memory files, create wiki index/architecture/file-map pages, mark unclear/dead/suspicious files as `needs verification`, and finish with cleanup/refactor guidance.

Actions completed:

- Routed memory scope with `context-scope-router`.
- Confirmed standard memory files were missing.
- Used `project-context-bootstrap` and `ambient-context-retrieval`.
- Inspected README, package/config files, route inventories, App Router entrypoints, Prisma schema, migrations, tests, docs, agent logs, public assets, and major source directories.
- Created `AGENTS.md`.
- Created `docs/context/PROJECT.md`.
- Created `docs/context/STATUS.md`.
- Created `docs/context/DECISIONS.md`.
- Created `docs/context/SOURCES.md`.
- Created `docs/context/SKILLS.md`.
- Created `docs/context/LOG.md`.
- Created `docs/wiki/index.md`.
- Created `docs/wiki/architecture.md`.
- Created `docs/wiki/file-map.md`.

Important findings:

- `main` was clean and tracking `origin/main` before edits.
- The repo has substantial implementation and test coverage already, plus extensive agent task history.
- Current app surface no longer has a Radar page. A later cleanup pass removed the Radar backend/API/model/assets from the active product surface.
- Theme-only `localStorage` is allowed for non-sensitive UI preference; household/private/secrets storage remains prohibited in browser storage.
- DB-backed verification remains the recurring release concern when Postgres/Docker is unavailable.
- Ignored local clutter exists (`.DS_Store`, `tsconfig.tsbuildinfo`, local env/reference/build/test artifacts); no tracked matches were found for the checked ignored private/generated files.

Verification:

- Confirmed all requested memory/wiki files are present and non-empty.
- Ran a trailing-whitespace scan over `AGENTS.md`, `docs/context`, and `docs/wiki`; no matches.
- Did not rerun full app test suites because this pass changed documentation/index files only.

## 2026-05-09 - Dynamic Redesign Implementation

Requested by the user: implement the approved website redesign, keep mock assets out of the runtime app, make the redesign dynamic rather than specifically light/white, avoid breaking behavior, and finish with local/GitHub on the same merged commit.

Actions completed:

- Converted the approved mock direction into a theme-adaptive app polish pass using Fairplay CSS tokens for page gradients, chrome, panels, cards, inputs, and active navigation.
- Updated shared shell/auth/UI primitives plus the main app pages: Your Deck, Deal, Board, Ask Greg, Check-ins, Theory, Settings, Card Library, Onboarding, and responsibility detail/edit surfaces.
- Preserved existing public assets; mock images were not copied into the app and no runtime asset replacement was performed.
- Increased the dark-mode visual QA timeout to reflect the heavier multi-page full-page screenshot pass.

Verification:

- `git diff --check`
- `npm run prisma:validate`
- `npm run lint`
- `npm run typecheck`
- `npm test -- --run`
- `npm run build`
- `npx playwright test e2e/dark-mode-visual.spec.ts`
- `npx playwright test e2e/little-alex-physics.spec.ts -g "uses a static draggable-safe mode with reduced motion"`
- `npm run test:e2e`
- Browser-rendered authenticated QA across the main protected app pages, each with expected headings and zero console errors.
