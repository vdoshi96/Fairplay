# Visual System Direction

## Product Feel

Fairplay should feel calm, practical, warm, and respectful. It helps a household notice work, make decisions, and revisit agreements without turning the interface into a scoreboard, therapy tool, or confrontation script.

The visual tone can be cute and companionable, but it must stay adult, useful, and relationship-safe: friendly enough to soften a hard conversation, disciplined enough for repeated planning.

## Visual Principles

- Mobile-first and scanable: information should be legible in short sessions on a phone.
- Warm, not childish: rounded shapes, simple characters, and small celebrations are welcome; toy-like, patronizing, or babyish art is not.
- Practical, not clinical: avoid therapy-office cues, diagnostic charts, crisis language, and moral judgment.
- Non-punitive: owner distribution and check-ins must never look like partner scores, winner/loser comparisons, or failure proof.
- Explicit visibility: private, shared, partner-visible, and check-in-only states need clear labels and consistent icon/color support.
- Original by default: no source deck/card visuals, no copied public app style, no workbook/table mimicry, no source character designs, and no proprietary taxonomy.

## Palette Direction

Use a balanced palette with warm neutrals, fresh accents, and strong text contrast. Avoid a one-note beige, purple-blue, slate, or brown/orange theme.

### Core Tokens

| Token | Hex | Use |
| --- | --- | --- |
| `--fp-ink` | `#20212A` | Primary text on light surfaces |
| `--fp-muted-ink` | `#5A5E6F` | Secondary text |
| `--fp-paper` | `#FFFDF8` | App background |
| `--fp-surface` | `#F7F8FB` | Raised operational surfaces |
| `--fp-line` | `#D9DEE8` | Borders and dividers |
| `--fp-alex` | `#2C8F7A` | Alex avatar and ownership accent |
| `--fp-max` | `#4568D9` | Max avatar and ownership accent |
| `--fp-shared` | `#D9714A` | Shared ownership and handoff accent |
| `--fp-helper` | `#F2B84B` | Helper motif and gentle highlights |
| `--fp-success` | `#2F9F68` | Completion and resolved states |
| `--fp-caution` | `#B7791F` | Needs-review and soon states |
| `--fp-danger` | `#B94A48` | Destructive confirmation only |

### Accessible Pairings

- Primary text: `--fp-ink` on `--fp-paper`, `--fp-surface`, or white.
- Muted text: `--fp-muted-ink` on `--fp-paper` or white for supporting copy only.
- Alex accent: `--fp-alex` as border/icon on light surfaces; use `--fp-ink` for text beside it.
- Max accent: `--fp-max` as border/icon on light surfaces; use white text only on large filled Max buttons or badges.
- Shared accent: `--fp-shared` for ownership chips and handoff states; avoid pairing it with long white text unless contrast is verified.
- Danger: reserve for destructive confirmations; never use red to shame an owner or overdue review.

## Type Direction

Use a modern humanist sans-serif with high x-height and clear numerals. Preferred direction for implementation:

- Primary UI: Geist Sans, Inter, or system sans fallback.
- Numeric/compact labels: same family, tabular numerals where available.
- No decorative display font in core product surfaces.
- Avoid negative letter spacing. Keep letter spacing at `0` except all-caps micro-labels, which may use `0.04em`.

Suggested scale:

- App title or major screen heading: 28/34, weight 700.
- Screen heading: 22/28, weight 700.
- Section heading: 17/24, weight 650.
- Body: 15/22, weight 400.
- Compact metadata: 13/18, weight 500.
- Chip labels: 12/16, weight 650.

## Spacing And Layout

Use an 8px spacing grid with compact mobile-first density:

- Page horizontal padding: 16px on mobile, 24px tablet, 32px desktop.
- Surface padding: 12px to 16px for dense lists; 20px for forms and check-in steps.
- Gaps: 8px for related controls, 12px for small groups, 16px for sections, 24px for major breaks.
- Minimum tap target: 44px.
- Keep bottom navigation and primary action areas stable; avoid layout jumps when labels, badges, or avatars load.

## Shape Language

- Use 8px radius for cards, panels, sheets, and repeated list items.
- Use 999px radius only for chips, avatar masks, pills, and progress dots.
- Use soft asymmetric illustration shapes for characters and empty states, but not for functional controls.
- Avoid physical card/deck proportions and printable-card metaphors. Responsibility summaries may be compact panels, not collectible cards.
- Borders should be quiet: 1px `--fp-line`, with accent borders for state only.

## Component Direction

### App Shell

- Quiet header with active persona, household name, and a clear persona switch affordance.
- Bottom navigation on mobile for Home, Load Map, Library, Check-Ins, Crash Course, and Settings.
- Visual assets should sit beside the workflow, not in front of it: small avatar in the shell and helper mascot in onboarding or empty states.

### Responsibility Rows

- Use compact rows or panels with title, owner state, cadence, review timing, status, and visibility.
- Owner indicators should be small avatar dots or color rails, not full character art in every row.
- Shared ownership should use a braided or linked-dot motif, not a versus layout.
- Avoid red overdue shame. Use "Needs review" or "Review soon" visual tone with caution accents.

### Check-Ins

- Use one compact schedule card, one confirmation state, and one optional notes area.
- Keep the page practical and quiet; avoid agenda builders, conversation scripts, or step-heavy ceremony.
- Completed states should feel recorded, not celebrated as a performance.

### PWA Icon

- Direction: rounded square icon with a simple household orbit mark, two balanced persona dots, and one helper spark.
- It should read clearly at 48px, 96px, 192px, and 512px.
- Avoid cards, scales, chores icon piles, hearts as the primary mark, or any source-like deck motif.
- Preferred base: `--fp-paper` or white with `--fp-alex`, `--fp-max`, `--fp-shared`, and `--fp-helper` accents.

## Character System

Fairplay may use three original visual companions:

- Alex: steady, observant, curious. Visual cue: rounded mint/teal avatar with soft square glasses and a small leaf-shaped hair/hat accent.
- Max: energetic, thoughtful, practical. Visual cue: blue/lilac avatar with a small swoop cap shape and warm scarf notch.
- Household helper: neutral guide motif, not a pet or child. Visual cue: small house-orbit sprite with a friendly face, tiny spark, and tool-free hands.

Usage rules:

- Alex and Max must not encode gender, relationship role, age, race, income, or household stereotypes.
- Do not show one character as the default manager, nag, helper, mess-maker, or fixer.
- Do not place Alex and Max in opposition poses. Use side-by-side, orbit, handoff path, or shared focus compositions.
- Keep expressions warm and neutral. Avoid anger, tears, shame, exhaustion, or smugness in product art.
- Character art is supportive, not required to complete tasks. The app must remain fully usable without images.

## Future Image Prompts

These prompts are for future human-approved image generation or illustration work only. Do not call an image generation API until credentials, policy, and review are confirmed.

### Alex Avatar

Prompt: "Create an original friendly cartoon avatar for a household planning app named Fairplay. Alex is a gender-neutral character with a rounded soft face, tiny square glasses, a small leaf-shaped hair or cap accent, and a calm curious expression. Use a clean vector-like style, simple shapes, warm adult tone, teal and fresh green accents, high contrast on a light background, mobile app avatar composition, centered bust crop, no text."

Negative prompt: "No card deck, printable card, workbook, Trello board, Better Share style, Fair Play source art, copied character design, childish baby style, therapy mascot, gender stereotype, chore stereotype, accusation expression, score or scale icon."

### Max Avatar

Prompt: "Create an original friendly cartoon avatar for a household planning app named Fairplay. Max is a gender-neutral character with a soft oval face, small swoop cap shape, simple curved eyebrows, and an attentive practical expression. Use clean vector-like geometry, warm adult tone, blue and periwinkle accents with a small coral detail, centered bust crop, light background, mobile app avatar composition, no text."

Negative prompt: "No card deck, printable card, workbook, Trello board, Better Share style, Fair Play source art, copied character design, childish baby style, therapy mascot, gender stereotype, chore stereotype, blame pose, winner-loser framing, score or scale icon."

### Household Helper Mascot

Prompt: "Create an original neutral household helper mascot for Fairplay, a practical household planning app. The mascot is a small rounded house-orbit sprite with a simple friendly face, two tiny floating hands, one golden spark, and a balanced teal-blue-coral palette. It feels like a gentle guide for organizing responsibilities, not a pet or child. Clean vector-like style, transparent or light background, no text."

Negative prompt: "No animals, no robots that look clinical, no therapy symbol, no broom/mop stereotype, no chore pile, no card deck, no printable card, no source-like household method imagery, no copied public app art, no gendered role cues."

### Check-In Celebration

Prompt: "Create an original small celebration illustration for completing a household check-in in Fairplay. Show Alex and Max avatar dots or simplified faces near a shared path with a few soft confetti shapes, one helper spark, and a completed review loop. The tone is relieved and calm, not party-like or childish. Clean vector-like style, high contrast, light background, no text."

Negative prompt: "No trophy, no winner, no loser, no grade, no scale, no argument, no therapy scene, no deck/card imagery, no copied public app art, no source-like printable layout, no excessive confetti."

### PWA Icon

Prompt: "Create an original app icon for Fairplay, a mobile-first household responsibility planning app. Rounded square icon, light warm background, two balanced dots for Alex and Max connected by a soft orbit path around a tiny home mark, one golden helper spark. Clear at small sizes, minimal vector-like geometry, teal, blue, coral, yellow, and dark ink accents, no text."

Negative prompt: "No playing cards, no deck, no board columns, no chore checklist as the main mark, no heart as the primary symbol, no scales of justice, no copied source style, no public app mimicry, no tiny unreadable details."

## Motion Principles

- Motion should clarify state change, not reward compliance or shame delay.
- Use 120ms to 220ms for control feedback, 240ms to 420ms for larger state transitions.
- Use ease-out for entry, ease-in for exit, and gentle spring only for avatar hover.
- Respect `prefers-reduced-motion: reduce` by disabling looping motion, replacing transitions with opacity changes, and removing confetti travel.

Recommended animation names for implementation:

- `fp-persona-bob`: optional idle/hover avatar movement, 2px to 4px vertical travel, 3s to 5s loop, paused by default unless near active persona UI.
- `fp-assignment-shift`: ownership transition between persona dots, 260ms path/opacity movement with clear final label.
- `fp-checkin-spark`: small completion burst using 5 to 9 geometric pieces, 500ms max, non-looping.
- `fp-panel-enter`: list or step entry, 160ms opacity plus 4px upward movement.

## Placeholder Assets

Approved placeholder SVGs live in `docs/assets/visuals/`:

- `alex-avatar.svg`
- `max-avatar.svg`
- `helper-mascot.svg`
- `pwa-icon-concept.svg`

These are documentation assets and source-of-direction placeholders. T09 may copy approved SVGs into `public/assets/fairplay/` or use them as references for implementation, preserving originality and accessibility rules.

## IP And Safety Guardrails

- Do not consult private `References/` materials for visual implementation.
- Do not copy Fair Play, Better Share, Trello, workbook, PDF, or deck/source visual style.
- Do not use a literal card-game or printable-card design metaphor.
- Do not use source category names, copied labels, copied prompts, copied examples, or proprietary taxonomies in illustrations.
- Do not make one partner look responsible and the other irresponsible.
- Do not use visuals that pressure a user into unsafe confrontation.
- Do not imply clinical diagnosis, couple therapy, or professional advice.

## Open Visual Needs

- Final production illustration pass after app screens exist.
- Final PWA icon export sizes and maskable icon safe-area review.
- Contrast verification against actual Tailwind tokens after implementation.
- Reduced-motion browser verification during T09.
