# Handoff

## Status

Visual direction is ready for implementation task T09.

## Approved Direction

- Mobile-first, warm, practical, relationship-safe visual language.
- Balanced palette using ink, paper, teal for Alex, blue for Max, coral for shared ownership, yellow for helper highlights, and restrained purple for radar.
- Cute original cartoon support for Alex, Max, and a neutral household helper motif.
- Operational screens should stay dense and scanable; visual elements should support state recognition without blocking forms, lists, or controls.
- Motion should be lightweight, reversible, and respectful of reduced-motion preferences.

## Approved Placeholder Assets

Documentation placeholders live under `docs/assets/visuals/`:

- `alex-avatar.svg`
- `max-avatar.svg`
- `helper-mascot.svg`
- `radar-board-placeholder.svg`
- `pwa-icon-concept.svg`

For T09, copy approved assets into `public/assets/fairplay/` only if placeholder art is desired in the app. Preserve file names or use clear equivalents:

- `public/assets/fairplay/alex-avatar.svg`
- `public/assets/fairplay/max-avatar.svg`
- `public/assets/fairplay/helper-mascot.svg`
- `public/assets/fairplay/radar-board-placeholder.svg`
- `public/assets/fairplay/pwa-icon-concept.svg`

Use meaningful alt text when an asset communicates content, such as "Alex avatar" or "Shared radar illustration." Use empty alt text for decorative instances.

## CSS Variable And Token Handoff

Map these tokens into `src/app/globals.css` and Tailwind config during implementation:

- `--fp-ink: #20212A`
- `--fp-muted-ink: #5A5E6F`
- `--fp-paper: #FFFDF8`
- `--fp-surface: #F7F8FB`
- `--fp-line: #D9DEE8`
- `--fp-alex: #2C8F7A`
- `--fp-max: #4568D9`
- `--fp-shared: #D9714A`
- `--fp-helper: #F2B84B`
- `--fp-radar: #8B5FBF`
- `--fp-success: #2F9F68`
- `--fp-caution: #B7791F`
- `--fp-danger: #B94A48`

Keep text contrast anchored on `--fp-ink`; do not rely on colored text alone for state.

## Animation Names For T09

- `fp-persona-bob`: subtle avatar hover or active-persona idle, 2px to 4px travel, optional loop.
- `fp-radar-pulse`: low-opacity radar ring, no flashing alarm language.
- `fp-assignment-shift`: owner/support transition between persona dots.
- `fp-checkin-spark`: small non-looping completion burst.
- `fp-panel-enter`: short opacity and 4px upward entry for panels or steps.

All animations must respect `prefers-reduced-motion: reduce`.

## What Not To Do

- Do not create app behavior, server logic, data models, or domain names from this task.
- Do not call image generation APIs without separate approval.
- Do not consult private `References/` materials.
- Do not copy Fair Play, Better Share, Trello, workbook, PDF, source deck, public app, or proprietary taxonomy visual styles.
- Do not use card deck, printable card, board-column, scoring, scale, trophy, or winner/loser metaphors.
- Do not make Alex or Max carry gendered, stereotyped, blaming, exhausted, smug, or irresponsible roles.
- Do not use visuals that pressure users into confrontation or imply therapy/diagnosis.

## Recommended T09 Flow

1. Read `docs/product/visual-system.md`, this handoff, and `docs/product/ip-safety-review.md`.
2. Copy approved SVG placeholders into `public/assets/fairplay/` if implementation uses placeholders.
3. Add visual components under `src/components/visuals/**` with accessible labels/decorative alt behavior.
4. Add motion utilities under `src/components/motion/**` and CSS keyframes/tokens in `src/app/globals.css`.
5. Replace feature placeholders only where visuals support comprehension or empty states.
6. Verify mobile and desktop screenshots for no overlap, no obscured labels, and no excessive motion.
