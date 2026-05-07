# Corrective Pass QA Plan

## Automated Commands

Run after all workstreams merge:

- `npm test -- --run`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `git diff --check`

Run focused tests before full sweep:

- App shell/page shell/background tests.
- Little Alex physics bounds tests.
- Load Map dashboard tests.
- Library AI task manager, AI draft contracts, API route, repository, and service tests.
- Crash Course content/layout tests.
- Seed/source-card display label tests.

## Responsive Visual Matrix

Check Home, Load Map, Library, Radar, Check-ins, Settings, and Crash Course at:

- Mobile narrow: `390x844`
- Short mobile/small browser: `390x640`
- Tablet/small desktop: `768x900`
- Normal desktop: `1280x900`
- Short desktop: `1280x720`
- Wide desktop: `1440x900`

## Visual Assertions

- No horizontal scrolling unless the Load Map board intentionally scrolls inside its own lane rail.
- No clipped cards, diagnostics, filter labels, or controls.
- Backgrounds are visible at page level and do not reduce text contrast.
- Bottom nav does not cover controls or Little Alex.
- Little Alex remains fully visible and outside the desktop sidebar.
- Learner buttons appear in a consistent action area and remain reachable.
- Crash Course image and text remain visually paired on short and tall viewports.
- Check-ins empty agenda modal appears when preview returns no items.
- Radar and Check-ins do not feel like isolated cards on blank beige space.
- Library generation prompt accepts another request immediately after submit.
- Failed Library generation requests do not block later requests.

## Manual Flow Checks

- Home: Crash Course and Card Library actions remain; redundant top-row learner shortcut is gone; Learn feature section is still useful.
- Load Map: filters are grouped and usable, diagnostics wrap, Alex/Max naming is preserved, dummy workflow still completes.
- Library: submit multiple text prompts; review completed result; retry failed result; cancel request; track/put in play where available.
- Radar: type into fields, choose checkboxes/options, create dummy workflow, clean up dummy artifacts.
- Check-ins: preview empty agenda, start dummy workflow, record/defer/complete, clean up dummy state.
- Crash Course: read conceptual sequence, final learning path is the only app-feature path section.
