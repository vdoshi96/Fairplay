# Lightweight Check-ins

Date: 2026-05-08
Branch: `codex/check-ins-lightweight-records`

## What Changed

- Replaced the agenda/conversation check-in UI with a lightweight record flow.
- New Check-ins page now supports only:
  - scheduling a check-in,
  - confirming that it happened,
  - adding or updating optional minutes/notes.
- Removed agenda preview, topic assignment, decision recording, skip/defer controls, and conversation prompts from the visible Check-ins UI.
- Added scheduled check-in creation through `/api/check-ins` using `scheduledFor`.
- Kept completion notes on the existing completion endpoint so completed records can update minutes.
- Reworked the Check-ins feature guide practice to mirror the new flow: schedule, confirm, save notes.
- Strengthened Check-ins background visibility with the shared page wash.

## Why

The previous Check-ins surface behaved like a guided conversation workflow. The requested product shape is closer to a reminder and record-keeping tool, so this branch removes unrelated concepts and narrows the UI to the durable actions users actually need.

## Design Decisions

- Scheduled records use `state: scheduled` and no agenda items.
- Confirmation uses the existing complete endpoint with `summary` as the notes/minutes field.
- Existing decision and item APIs remain in place for compatibility, but the app no longer exposes them in Check-ins.
- Practice copy avoids "dummy agenda" language and only teaches the supported lightweight flow.

## QA

- `npm test -- src/components/check-ins/check-in-flow.test.tsx src/components/guide/guide-content.test.ts src/app/api/check-ins/route.test.ts src/app/api/check-ins/[id]/complete/route.test.ts src/server/check-ins/service.test.ts src/contracts/check-ins.test.ts --run`

## Remaining Risks

- The final responsive pass still needs browser screenshots for the new schedule/record layout.
- Historical completed check-ins with generated summaries still render as notes; that is compatible but may read more formal than newly entered minutes.
