# Fairplay Personal-Use Redesign Spec

## Intent

Redesign Fairplay from a plain household-planning MVP into a polished personal-use app that uses the user's Fair Play reference materials, live Trello copy, workbook, PDF deck, and book-report research as first-class product inputs.

This spec supersedes the earlier v1 constraint that limited the app to a tiny invented seed set. The new product direction is private/personal use: the app may use original card titles, Trello board structure, card labels, CPE content, minimum standards, deck-inspired layout cues, and book-derived concepts from the local references and the user's Trello workspace copy.

The implementation must still keep source-derived material private to this user's repository/deployment and avoid presenting copied long source passages in public docs, public marketing, or assistant responses.

## Required Inputs

Implementation must use these artifacts as design and content references:

- Live Trello board: `Fairplay Copy` in Viahal's Workspace, board id `69f82d290f1cabd66e0fad29`.
- Trello lists: `Cards of Concern`, `Player 1`, `Player 2`, `Kid Split`, `Not in Play`, `Trimmed`.
- Trello labels: `Daily Grind`, `Caregiving`, `Out`, `Home`, `Magic`, `Wild`, `Happiness Trio`, `Kids`, `Kid Split`.
- Trello cards: the 100-card library currently in `Not in Play`, including card names, labels, descriptions, CPE sections, minimum standards, and PNG cover attachments.
- Workbook: `References/Copy of Fair Play Breakdown - Generic.xlsx`.
- Printable deck PDF: `References/61eb57f42331adae6bb733d1_Fairplay-PrintableCards.pdf`.
- Fair Play EPUB report: `docs/research/fair-play-book-report.md` and duplicate `References/fair-play-book-report.md`.
- A Better Share EPUB report: `docs/research/a-better-share-book-report.md` and duplicate `References/a-better-share-book-report.md`.
- Existing app code: `/Users/vishal/Developer/Fairplay/.worktrees/v1-app`.

## Product Promise

Fairplay should feel like a production-grade household operating system for a couple or family learning to use a card/deck model. It should make invisible work visible, help users understand ownership rather than mere helping, support CPE handoffs, and turn recurring tension into calm board movements, standards, radar notes, and check-ins.

The target experience is not a generic chore tracker. It is a guided, tactile, studio-quality interpretation of the Fair Play workflow for personal use.

## Product Principles

- **Ownership over chores:** A card represents accountable ownership of a responsibility, not just a visible task.
- **CPE made visible:** Conception, Planning, and Execution should be understandable from onboarding and inspectable in each card detail.
- **Standards before judgment:** Each card should support a household-specific definition of "done well enough" or minimum acceptable standard.
- **Fair is dynamic:** The app should encourage re-deals, handoffs, and reviews as life changes.
- **No scorekeeping as verdict:** Counts and distributions are useful signals, not moral grades or partner diagnoses.
- **Board movement should mean something:** Dragging a card into a lane should persist ownership/status/order and explain the implication.
- **Private preparation is valid:** A solo starter can read, sort, and draft before sharing or discussing.
- **Polished enough to trust:** The UI should feel deliberate, tactile, and refined, closer to a premium Apple-quality app than a Tailwind wireframe.

## Core Information Architecture

The app should shift from separate plain pages into a cohesive board-centered product:

- `/app/home`: polished command-center overview with deck progress, active owner counts, due reviews, open radar, next check-in, and crash-course progress.
- `/app/load-map`: primary Trello-style board for responsibility cards.
- `/app/library`: searchable full card library, source labels, card cover previews, and template/detail browsing.
- `/app/cards/[id]` or `/app/responsibilities/[id]`: rich card detail sheet/page.
- `/app/radar`: attention board for concerns and unclear standards.
- `/app/check-ins`: guided review rituals and previous summaries.
- `/app/crash-course`: skippable, replayable concept course.
- `/app/settings`: household/persona controls, crash-course replay, welcome replay, data/import controls, logout.

The app shell should include active route state, icons, a premium mobile tab bar, a desktop sidebar or split header, an active persona menu, and persistent welcome/crash-course entry points.

## Trello-Style Load Board

The Load Map should become a horizontal lane board using the live Trello structure as the baseline:

- `Not in Play`: library/reserve cards that are not currently active.
- `Cards of Concern`: cards needing discussion, standards, support, or review.
- `Player 1`: cards owned by the first persona.
- `Player 2`: cards owned by the second persona.
- `Kid Split`: cards intentionally split by child, context, season, or sub-responsibility.
- `Trimmed`: cards intentionally removed, paused, dropped, or irrelevant for now.

Board requirements:

- Cards must be draggable between lanes on desktop and touch devices.
- Cards must also be movable by keyboard and explicit action menus.
- Dropping a card into a lane must persist lane, sort order, owner/status implications, and an event.
- The board must support filtering by label, owner, cadence, hidden load type, review state, and search text.
- Lane headers should show counts, concise explanations, and subtle color identity.
- Empty lanes should teach what belongs there without looking like placeholder scaffolding.
- Card movement should feel tactile: lift, shadow, scale, snap, and destination highlight, respecting reduced motion.

Recommended technical path:

- Use `@dnd-kit/core` and sortable utilities for accessible drag/drop.
- Add first-class board placement fields rather than deriving lanes purely from visual state.
- Keep ownership and status fields canonical so future mobile/iOS clients do not depend on a web-only board abstraction.

## Card Library and Source Deck Content

The current 8-template seed is insufficient. The app should import the full 100-card personal-use library from Trello/workbook sources.

Each template/card should store:

- Source/Trello card id.
- Slug.
- Title.
- Labels/categories.
- Definition/overview.
- Conception section.
- Planning section.
- Execution section.
- Minimum standard.
- Cover image URL or locally imported cover asset reference.
- Source version/import timestamp.
- Default lane, usually `Not in Play`.
- Optional flags such as Daily Grind, Happiness Trio, Kids, Kid Split, Wild.

Each household responsibility instance should store:

- Template id nullable.
- Household-specific title override.
- Household-specific standard override.
- Notes.
- Lane.
- Board sort order.
- Owner/persona assignment state.
- CPE progress/notes.
- Cadence and relevant days.
- Visibility.
- Review dates.
- Radar links.
- Event history.

The UI should clearly distinguish a source template from the household's working instance. Users should be able to browse source content, copy it into play, edit household-specific details, and preserve the original template for later reference.

## Rich Card Detail

Opening a card should feel like a high-quality sheet, not a raw form.

Required sections:

- Large card cover or premium reconstructed card face.
- Title and label chips.
- Current lane and owner state.
- Definition/overview.
- CPE tabs or stacked sections: Conception, Planning, Execution.
- Minimum standard/source standard.
- Household standard editable field.
- Notes and context.
- Handoff requirements.
- Review date and status.
- Actions: move lane, assign owner, split, flag for radar, schedule check-in, trim, restore.

The sheet should be usable on mobile with stable bottom actions and on desktop as a side panel/modal that does not lose board context.

## Crash Course and Onboarding

The crash course must teach the concepts before asking users to manipulate the board. It must be skippable, persistent until intentionally dismissed where appropriate, and retriggerable from Settings.

The curriculum should combine the two book reports:

1. **Why this is not a chore app**
   - Household work includes visible execution, cognitive coordination, and emotional/care load.
   - The board helps make work discussable rather than proving someone is bad.

2. **Owner vs. helper**
   - Helping with a step is not the same as owning the outcome.
   - The app's lanes and owner fields reflect accountability, not blame.

3. **CPE: Conception, Planning, Execution**
   - Teach the lifecycle with a real card example.
   - Show where each section appears in card detail.

4. **Minimum standards and done well enough**
   - Explain why households define standards before judging follow-through.
   - Prompt users to rewrite a standard in their own words.

5. **The board lanes**
   - Explain `Not in Play`, `Cards of Concern`, `Player 1`, `Player 2`, `Kid Split`, and `Trimmed`.
   - Show what happens when a card is dragged into each lane.

6. **Build your active deck**
   - Start by trimming irrelevant cards.
   - Move likely active cards into concern or owner lanes.
   - Keep the rest in the library.

7. **Handoffs and re-deals**
   - Ownership can change, but context must travel with it.
   - Handoff requires standard, timing, access, dependencies, and review date.

8. **Radar and check-ins**
   - Radar is for unclear expectations, blockers, and review topics.
   - Check-ins convert board tension into decisions and next review dates.

9. **Fair is dynamic**
   - The goal is a workable, revisable share of load, not perfect 50/50 math.

10. **Repair and resistance**
   - Normalize defensiveness, hidden expectations, and solo-starting.
   - Encourage pausing, private drafting, and calm invitations to discuss.

Crash-course UX requirements:

- First-run welcome splash persists across app routes until the user clicks close.
- Crash course can be skipped without losing the ability to restart it.
- Settings includes `Restart crash course` and `Show welcome again`.
- Course progress/dismissal is persisted server-side, ideally persona-scoped.
- The course should include interactive examples, not only text.
- It must avoid using visible in-app paragraphs to explain obvious UI mechanics; explanation belongs inside the guided lesson context.

## Persistent Welcome Splash

The new-household welcome splash must be persistent until explicitly closed.

Requirements:

- Show after household creation/persona selection and on every protected route until dismissed.
- Dismiss only when the user clicks the close control.
- Store dismissal server-side.
- Do not store household/private state in `localStorage`.
- Provide Settings action to show it again.
- Welcome should point to the crash course, card library, and board, without blocking the user from navigating.

## Visual and Interaction Direction

The redesign should be substantially more polished than the current app.

Visual requirements:

- Move from repeated plain white panels to a designed system of glassy/soft operational surfaces, lane backgrounds, premium cards, chips, icon buttons, and sheets.
- Use a richer balanced palette: warm neutral base plus distinct label colors for Home, Out, Caregiving, Magic, Wild, Daily Grind, Happiness Trio, Kids, and Kid Split.
- Use icons for navigation and card actions.
- Use stable dimensions for lane cards, card covers, counts, chips, and action bars.
- Add subtle motion for card lift/drop, sheet open/close, course step transitions, and check-in completion.
- Avoid text overflow in chips, cards, and mobile lane headers.
- Preserve professional density: this is an operational product, not a marketing landing page.

Interaction requirements:

- Drag/drop is the hero interaction.
- Card sheets should support fast edit, move, and radar actions.
- Bulk actions should be available for importing/resetting the deck.
- Mobile should support lane swipe or a compact board/list toggle.
- Accessibility must include keyboard movement, focus management, ARIA labels, and reduced-motion behavior.

## Data and API Changes

The implementation should add or adapt the schema to support:

- Full source card templates.
- Template import metadata.
- Board lane enum and sort order.
- Template-to-household responsibility instantiation.
- Persona-scoped preferences for welcome and crash-course state.
- Card detail sections for definition, CPE, and standards.
- Event history for lane moves, ownership changes, handoffs, trim/restore, and review decisions.

Recommended enum:

```text
ResponsibilityBoardLane:
  cards_of_concern
  player_1
  player_2
  kid_split
  not_in_play
  trimmed
```

Recommended routes:

- `GET /api/card-templates`
- `POST /api/card-templates/import/trello`
- `POST /api/responsibilities/from-template`
- `PATCH /api/responsibilities/[id]/board-placement`
- `PATCH /api/preferences/onboarding`
- `POST /api/preferences/welcome/replay`

The API should keep explicit JSON contracts, stable string enums, and household/persona scoping.

## Implementation Sequencing

Implementation should be split into PRs that can be reviewed and merged in order:

1. **Research and import foundation**
   - Card template contract, parser/importer, full source library seed/import, and tests.

2. **Board data model**
   - Board lane/sort fields, placement API, event history, migration, and tests.

3. **Design system and app chrome**
   - Shared UI primitives, icons, nav redesign, global tokens, premium shell.

4. **Card library and detail**
   - Library page, source card browsing, card sheet/detail, from-template creation.

5. **Trello-style Load Board**
   - Drag/drop lanes, keyboard movement, filters, responsive board/list mode.

6. **Welcome and crash course**
   - Persistent welcome, crash-course route, progress/dismissal preferences, Settings replay.

7. **Radar/check-in polish**
   - Align radar and check-ins with the new concept model and visual system.

8. **End-to-end verification and deployment cleanup**
   - Full regression, browser screenshots, build/type/lint/test, deployment checklist.

## GitHub and Merge Requirements

All implementation work after this spec must follow this source-control discipline:

- Create a separate `codex/` branch for each major implementation PR unless a single PR is explicitly approved for a small slice.
- Commit every coherent task with a clear message.
- Push every implementation branch to GitHub.
- Open a GitHub pull request for each branch.
- Keep PRs reviewable and ordered according to the implementation sequence above.
- Do not merge a PR until its tests/build pass and any dependent earlier PR has merged.
- Merge PRs in dependency order.
- After the final PR merges, update local `main` from GitHub `main`.
- Verify local `main` and `origin/main` point to the same commit.
- Delete or leave feature branches only after the user confirms branch cleanup preference.

The final task is not complete until local main and GitHub main are synchronized and the deployed app reflects the merged code.

## Testing and Verification

Minimum verification for implementation:

- Unit/contract tests for template parsing/import and board placement.
- Repository/service/API tests for household scoping and lane movement.
- Component tests for crash-course progress, welcome persistence, settings replay, card library, card detail, board drag/drop fallback, and keyboard movement.
- E2E tests for create household, first-run welcome, crash course skip/replay, import/use card, drag card between lanes, open card detail, create radar item, and run check-in.
- Browser visual verification across mobile and desktop.
- Accessibility checks for focus traps, keyboard movement, reduced motion, and mobile tap targets.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and targeted Playwright tests before any completion claim.

## Open Questions for Implementation

- Should Trello card cover PNGs be hotlinked, imported into local/public storage, or stored as private app assets?
- Should the full source card text be committed into the repository, imported from Trello at seed time, or kept in a private generated seed file?
- Should persona names remain Alex/Max or become Player 1/Player 2 to mirror the board?
- Should `Kid Split` be a lane only, or also a structured split model that can assign child/context-specific ownership?
- Should `Cards of Concern` be unified with Radar or remain a board lane that can optionally create radar items?
- Should the app support resetting the board from the source Trello copy?
- Is the GitHub repository private before source-derived card content is pushed?

## Definition of Done

The redesign is done when a new household can:

- See a persistent welcome until it is closed.
- Complete or skip a crash course and restart it from Settings.
- Browse the full personal-use card library.
- Open a rich card detail with CPE and minimum standard content.
- Move cards between Trello-style lanes with drag/drop and keyboard controls.
- Persist card lane, owner/status, and sort order.
- Create radar topics from unclear cards.
- Run a check-in that records decisions and review dates.
- Experience a cohesive, polished app chrome and visual system on mobile and desktop.
- Pass tests, build, browser verification, PR review, ordered merges, and final local/GitHub main synchronization.
