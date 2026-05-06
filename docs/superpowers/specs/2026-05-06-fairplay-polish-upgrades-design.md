# Fairplay Polish Upgrades Design

## Goals

- Make dark mode readable across real app pages and verify it with screenshots.
- Add a clear settings toggle for light/dark while preserving system-mode support.
- Replace the Library-local Little Alex helper with a static Greg Taskmaster avatar sitting above the AI capture button.
- Capitalize the button as `Greg - The Taskmaster`.
- Improve global Little Alex behavior: 10% faster flings, post-fling speech bubble, idle walking after 5 seconds, cursor/touch glance, black suit/white shirt/clipboard styling, and persona-scoped customization.
- Keep work isolated by branch, reviewed by agents, merged in a controlled order, and pushed so GitHub matches local.

## Workstreams

### Theme Toggle And Dark QA

Settings keeps the existing `system`, `light`, and `dark` theme model, but the UI becomes clearer: a system-follow toggle controls whether the app follows OS settings, and a two-state light/dark switch is shown for explicit override. Dark readability is handled at the token/utility layer and on the highest-risk surfaces found by QA. Hard-coded `bg-white`, pale stone text, and pale cards must no longer produce white-on-white or low-contrast content in dark mode.

QA includes component tests for the toggle behavior and a Playwright dark-mode screenshot smoke that visits real app routes after login. Screenshots are reviewed visually and recorded in the final QA document.

### Greg Taskmaster Library Avatar

The Library AI capture area removes the local `LittleAlexHorneSidekick` entirely. A new static Greg avatar image sits visually above the `Greg - The Taskmaster` button. The asset is an original illustrated host on a throne, inspired by Taskmaster staging and Greg Davies' show silhouette without relying on a photo-real reproduction. The global draggable Little Alex remains the only Little Alex in the app.

Guide copy, component tests, and E2E text expectations use the corrected capitalization.

### Little Alex Behavior And Settings

Little Alex remains a decorative global physics object. Flings apply 10% more velocity/gravity than the current implementation while retaining containment. Each fling shows a speech bubble using the configured phrase, defaulting to `i'm little alex horne`.

After 5 seconds untouched, Little Alex transitions into an idle walk: he settles upright on the bottom edge, moves slowly, flips direction at edges, pauses roughly every 5 seconds, and glances toward the cursor. On touch/mobile, when no cursor exists, he glances toward the last touched element/point. Reduced-motion mode keeps the static draggable-safe behavior and does not start idle walking.

Settings adds a Little Alex section with:
- Gender presentation: neutral, masculine, feminine.
- Chat bubble phrase, trimmed and limited to 30 characters.
- Skin tone, selected from constrained swatches.

These preferences are persona-scoped in the database, exposed through `/api/preferences/little-alex`, loaded by app layout for the global overlay, and editable from Settings. All appearance options keep the black suit, white shirt, and clipboard.

## Data Model

Add `PersonaLittleAlexPreferences` with a unique `personaId`, `genderPresentation`, `chatPhrase`, `skinTone`, timestamps, and cascade delete. Defaults are neutral presentation, default phrase, and medium skin tone.

## Branches And Merge Order

1. `codex/fairplay-theme-dark-qa`
2. `codex/fairplay-greg-taskmaster-avatar`
3. `codex/fairplay-little-alex-upgrades`

Theme merges first because Greg and Little Alex visual work should inherit readable dark-mode surfaces. Greg merges second because it touches Library and guide copy but not database schema. Little Alex merges last because it touches Prisma, app layout, settings, physics, and E2E behavior.

## Verification

Each branch runs focused unit/component tests, lint, typecheck, and at least one browser check when visual behavior changes. The final merged `main` runs:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
```

Final QA also records dark-mode screenshots and the local/GitHub commit SHA comparison after push.
