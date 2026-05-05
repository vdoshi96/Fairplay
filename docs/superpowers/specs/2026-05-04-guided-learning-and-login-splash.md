# Guided Learning and Login Splash Design

## Purpose

Fairplay now explains the household methodology well through the crash course, but users still need practical app guidance: what "in play" means, how cards become responsibilities, how lanes work, how assignment and editing behave, and when to use Radar or Check-ins. The login page also needs a warmer first impression that matches the app's helpful, original character system.

This design adds user-triggered product guidance without forcing tours on people who already know the system.

## Product Direction

Use two learning layers:

- **Crash course:** methodology and mindset. It teaches why the app exists: invisible work, ownership, CPE, standards, handoffs, and fair-is-dynamic thinking.
- **App guide:** practical usage. It teaches where to click, what terms mean, how to create and move cards, how to edit responsibilities, and how Radar/Check-ins connect to the board.

Both layers should be reachable from Home and Settings. Neither layer should block normal use unless the user intentionally starts a guided tour.

## Home Learning Surface

Home should replace the current generic cards with a more useful learning hub plus contextual feature entry points.

Recommended layout:

- A compact hero/banner titled around "Learn Fairplay in layers."
- Primary actions:
  - "Crash course" for methodology.
  - "App guide 101" for basic usage.
  - "Card library" for browsing the source deck.
- Feature cards for Load Map, Library, Radar, Check-ins, and Settings.
- Each feature card includes a friendly helper character and a **Learn this feature** action.

The old "Open load map" action in the persistent welcome can be replaced by the more useful Home learning choices: crash course, app guide, and card library.

## Guided Tour Behavior

Feature guidance should be user-triggered only. No first-time auto-start.

When the user taps **Learn this feature**:

- The app enters a temporary teach mode.
- The page dims the background.
- One interface region is highlighted at a time.
- A coach bubble/text box explains the highlighted area in plain language.
- Unrelated clicks are blocked while the bubble is open.
- Controls include `Back`, `Next`, `Skip`, and `Done`.
- `Skip` immediately exits teach mode.
- `Done` exits and stores progress for that persona when persistence is available.
- Escape key exits teach mode.
- Reduced-motion users see static highlights with no animated travel.

The tour should feel like common software onboarding: focused, skippable, and practical. It should not feel like a modal quiz or a mandatory course.

## Guide Levels

The app guide should be organized as 101, 201, and 301.

### App Guide 101: Basic Use

Topics:

- What a card is.
- What "in play" means: a source card has become an active household responsibility.
- What "not in play" means: the card exists in the library/reserve but is not currently part of the household's active operating system.
- How to browse the card library.
- How to put a card in play.
- How to find the created responsibility.
- How to use the Load Map lanes at a basic level.

### App Guide 201: Editing and Ownership

Topics:

- How assignment works.
- Difference between owner, shared owner, helper, and backup.
- How to edit a responsibility.
- How household standards differ from source minimum standards.
- How to move a card between lanes.
- What happens when ownership changes.
- Why handoff context matters.

### App Guide 301: Operating the System

Topics:

- How Radar is used for blockers, unclear standards, and decisions that need calm review.
- How Check-ins turn Radar topics into decisions, deferrals, and next steps.
- How to trim, pause, or mark work not relevant.
- How review dates keep the system dynamic.
- How to avoid using card counts as a score.

## Feature Tour Scripts

Each feature tour should be short and concrete.

- **Load Map:** lanes, in-play state, owner lanes, cards of concern, not in play, trimmed, drag/drop or move menu, filters.
- **Library:** labels, search, source card detail, source minimum standard, CPE sections, Put in play.
- **Responsibility detail/edit:** title, standard, notes, lifecycle fields, assignment controls, visibility, status actions.
- **Radar:** draft/private topic, publish to check-in, defer, resolve, use for ambiguity not blame.
- **Check-ins:** preview agenda, skip/defer/record decision, completion summary.
- **Settings:** replay welcome, restart crash course, switch persona, logout.

Tours should use real UI labels and real terms from the app. They should avoid generic onboarding copy.

## Crash Course Character Scenes

Update the crash course so each methodology lesson can include a small friendly cartoon scene that emphasizes the point.

Use original Fairplay characters:

- Alex and Max as balanced, non-stereotyped persona figures.
- Household helper as a guide beside the concept.
- Nature/home motifs as gentle background support, not decoration overload.

Examples:

- Owner vs helper: one character carries the outcome path while another supports a step.
- CPE: helper points to three connected stages: conception, planning, execution.
- Minimum standards: characters align around a small shared note, not a judgment mark.
- Board lanes: helper points to lane signs.
- Handoffs: context travels with the card between characters.
- Radar and check-ins: a soft signal becomes a calm decision path.

These scenes should be lightweight and accessible. They can be implemented with SVG/CSS illustration components first, with richer assets later.

## Login Splash

Replace the plain login shell with a warm animated tableau.

Layout:

- Desktop: two-column composition.
  - Left: Fairplay mark, concise value proposition, login form.
  - Right: original character scene with a small household board, helper spark, plants, clouds, and soft nature/home-garden background.
- Mobile: form remains first-class and readable, with the illustration above or below depending on viewport height.

Visual behavior:

- Characters gently bob.
- Clouds drift subtly.
- Leaves sway lightly.
- Helper spark pulses.
- The small household board eases into view.
- `prefers-reduced-motion: reduce` freezes these into a static illustration.

Tone:

- Warm, adult, original, and lively.
- No source-deck visual copying.
- No childish or therapy-office framing.
- No one partner appears as manager, mess-maker, nag, or fixer.

## Settings and Retriggering

Settings should keep restart controls and add/reword guide controls:

- Restart crash course.
- Show welcome again.
- Open App Guide 101.
- Replay feature tours, either as a simple list or through each feature's "Learn this feature" button.

Progress persistence can be lightweight:

- Crash course progress already persists.
- Feature tour completion can be stored per persona if the existing preferences model is extended.
- If persistence is deferred, teach mode still works as a user-triggered session feature with clear skip controls.

## Accessibility

- Coach bubbles use `role="dialog"` or a clearly labeled region depending on implementation.
- Focus moves into the active bubble and returns to the triggering control on exit.
- `Back`, `Next`, `Skip`, and `Done` are keyboard accessible.
- Escape exits teach mode.
- Highlighted target has an accessible name in the bubble copy.
- The overlay must not trap users permanently if a target is missing; it should skip missing steps or exit with a friendly fallback.
- Animations honor reduced motion.
- Character illustrations are decorative unless they communicate essential content; essential meaning must also appear in text.

## Testing

Use TDD for implementation.

Required coverage:

- Home renders the learning hub and `Learn this feature` entries.
- Starting a feature tour shows a dimmed overlay, highlighted step, coach bubble, and navigation controls.
- Skip exits the tour.
- Next/Back change steps.
- Missing target handling does not crash.
- Settings exposes guide replay controls.
- Crash course renders character scene slots for lessons.
- Login page renders the new splash illustration and keeps the login form accessible.
- Reduced-motion CSS disables looping/ambient motion.
- Playwright smoke covers login page render and at least one guided tour path.

## Rollout

Implement in a PR branch and merge only after:

- Lint passes.
- Typecheck passes.
- Unit/component tests pass.
- Build passes.
- Playwright smoke passes.
- Vercel preview passes.

After merge, local `main` and `origin/main` should match.
