# Fairplay UI Layout Composition Design

## Goal

Refactor the Fairplay protected-app visual system so page art, cards, spacing, and route structure feel cohesive and intentional while preserving existing product functionality and leaving the floating Little Alex assistant untouched.

The user's May 6, 2026 brief is treated as the approved design direction for this execution pass.

## Scope

In scope:

- Shared protected-app page primitives for consistent width, padding, spacing, z-index, and page background behavior.
- Controlled background-art layers using existing Qwen-generated assets where available.
- Persistent, less-dominant welcome banner behavior and copy density.
- A centered, calm New Check-in launcher layout with grouped CTAs and restrained decoration.
- A final polish pass across Library, Radar, Check-ins, Crash course, and Settings.
- Lint, typecheck, build, and focused component verification after each branch.

Out of scope:

- Backend/data-flow changes unless needed to preserve existing UI behavior.
- Source card cover art regeneration.
- Repositioning, restyling, or redesigning Little Alex or its floating physics surface.
- Broad animation rewrites or new visual metaphors.

## Visual Direction

The app should feel warm, calm, playful, modern, and operational. Generated art becomes atmosphere, not foreground hero content. Text and controls sit on reliable readable surfaces with clear elevation, borders, and rhythm.

The composition should avoid a corporate dashboard feel, harsh stacked cards, accidental overlaps, giant cropped illustration panels, visual clutter, and one-note beige or purple-blue dominance.

## Architecture

`AppShell` remains responsible for navigation, session chrome, and Little Alex. A new page layer under `src/components/app-shell/` standardizes protected-page composition:

- `PageShell` owns max width, horizontal padding, vertical spacing, foreground z-index, and optional route-level background art.
- `PageHeader` creates compact, repeatable route headings and action slots.
- `PageSurface` or local Tailwind utility patterns are used for elevated content surfaces with consistent border/shadow/backdrop treatment.
- Background art is rendered as absolute, pointer-events-none layers behind content and masked/faded in CSS instead of being a repeated `backgroundImage` on cards.

Feature pages consume these primitives incrementally. Logic stays in existing route/component modules; UI-only props and wrappers should not change server actions, fetch calls, mutation behavior, guide hooks, or form state.

## Branch Plan

1. `codex/layout-shell-refactor`
   - Add shared page-shell primitives.
   - Move standard app-main spacing/background responsibility out of ad hoc page cards.
   - Update major route wrappers to use the shell without changing behavior.

2. `codex/background-art-integration`
   - Convert existing Qwen assets into background layers.
   - Add masking, opacity, and responsive sizing.
   - Remove foreground-style illustration panels where they fight content.

3. `codex/welcome-banner-cleanup`
   - Keep existing persistent dismissal API.
   - Reduce welcome dominance on non-home pages.
   - Add compact contextual rendering using pathname-aware client behavior.

4. `codex/check-in-page-redesign`
   - Redesign New Check-in as a centered workflow.
   - Preserve preview, remove suggested item, start, practice, and started-check-in behavior.

5. `codex/page-polish-pass`
   - Final route consistency pass for Library, Radar, Check-ins, Crash course, and Settings.
   - Tighten responsive behavior and route-specific spacing after all dependencies merge.

Branches merge into `main` in that order. Each branch gets focused tests plus `npm run lint`, `npm run typecheck`, and `npm run build` before merge.

## Testing

Testing emphasizes behavior preservation and structural UI guarantees:

- App shell tests assert standard pages expose the page-layer hooks and immersive crash course remains full canvas.
- Visual component tests assert background layers are decorative and use existing generated asset paths.
- Welcome tests assert dismissal still persists and compact behavior does not remove links.
- Check-in tests assert preview/start/remove/decision/complete flows keep working while the launcher layout changes.
- Final verification includes focused component tests, lint, typecheck, build, and browser screenshots/descriptions for the required routes.

## Risks And Controls

- Background art could reduce readability. Control with opacity, masks, and content surfaces.
- Page-shell changes can disturb route layouts. Control with narrow wrappers and existing component tests.
- Welcome persistence could regress. Control by preserving the existing PATCH endpoint and dismissed prop contract.
- Check-in layout edits can accidentally alter workflow state. Control by keeping mutation functions intact and testing the existing flow.
- Little Alex sits at a fixed z-index. Control by keeping page background/content z-index below modals and avoiding edits to Little Alex files.
