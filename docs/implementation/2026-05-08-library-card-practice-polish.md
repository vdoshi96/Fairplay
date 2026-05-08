# Library And Card Practice Polish

Date: 2026-05-08
Branch: `codex/library-card-practice-polish`

## What Changed

- Increased Library shelf background visibility and reused the shared page wash.
- Shortened Library labels, count text, Greg button copy, and source-card action text.
- Added stronger card containment for long titles and summaries using fixed rows, clamps, and anywhere wrapping.
- Replaced the card detail sheet's six move buttons with one destination select and a single `Move` action.
- Reworked the Library practice workflow around plain field names:
  - `Practice card request`: what the card should cover.
  - `Title`: the card name.
  - `Summary`: what done should mean.
  - `Purpose`, `Notice`, `Plan`, `Do`, `Minimum`: concise draft preview sections.
- Renamed AI draft review fields from implementation terms to user terms:
  - `Area tags` instead of area keys.
  - `Work type tags` instead of hidden effort keys.
  - `Rhythm` instead of cadence.

## Why

The Library page was doing too much visually and textually. This pass keeps the same capabilities while making cards easier to scan, move actions easier to use, and practice copy easier for first-time users to understand.

## Design Decisions

- Source-card buttons keep specific accessible names such as `Put Auto in play`, but visible button text is shortened to `Put in play`.
- The card detail move action remains explicit: users choose a destination and then confirm with `Move`.
- Practice language no longer leads with "dummy"; it explains that the workflow is temporary and does not create real household cards.
- Comma-separated internal fields remain compatible with the existing API payload, but the UI no longer exposes implementation wording.

## QA

- `npm test -- src/components/library/card-library.test.tsx src/components/cards/card-detail-sheet.test.tsx src/components/library/ai-task-manager.test.tsx src/components/guide/guide-content.test.ts --run`

## Remaining Risks

- Full browser responsive QA is deferred to the final responsive pass after Check-ins and Crash Course changes land.
- Very large label sets may eventually need a compact label menu, but the current fixed label vocabulary still wraps cleanly.
