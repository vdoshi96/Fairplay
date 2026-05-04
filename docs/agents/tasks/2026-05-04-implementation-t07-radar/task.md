# T07 Radar Concern Board UI And API Mutations

## Assignment

Implement the radar service, API routes, authenticated radar page, mobile-first radar board UI, and focused tests for persona-scoped radar visibility and item transitions.

## Scope

- Branch: `codex/v1-app`
- Commit message: `feat: add radar board`
- Owned areas: `src/server/radar/service.ts`, `src/app/api/radar/**`, `src/app/app/radar/page.tsx`, `src/components/radar/**`, radar tests, e2e radar test, and task docs.

## Requirements Covered

- Persona-filtered radar list/detail access returns shared/partner/check-in items plus only the selected persona private drafts.
- Create/update supports topic, notes, linked responsibility id, reason, urgency, visibility, and schedule linkage.
- Private visibility defaults to `draft`; visible radar items default to `open`.
- Private draft publishing requires explicit confirmation and names the target visibility in the UI.
- Defer, resolve, dismiss, and schedule actions are available from the board.
- Check-in scheduling supports `targetCheckInId` or a scheduled check-in-ready placeholder when no check-in exists yet.
- Radar copy uses neutral reason labels and avoids score, proof, complaint, failure, and blame framing.
