# Learned

- `checkInService.preview` now builds agenda suggestions from sources without calling `getActiveCheckIn` or `createCheckIn`, so preview no longer creates or resumes an active check-in.
- `NewCheckInLauncher` starts check-ins by posting selected radar and responsibility ids derived from the current preview list, so removing a suggestion removes that id from the start payload.
- `checkInService.updateItem` now loads the household check-in first and verifies the item is nested in that active check-in before delegating to persistence; the Prisma update path also scopes by `id` and `checkInId`.
- The guided decision UI now exposes owner and review-date controls for responsibility owner/role decisions and sends a structured `responsibilityEffect` with `assignments` and `revisitAt`.
- The remaining max-agenda issue is not in the default UI path, which sends `maxItems: 5`, but it is still reachable through the public create/preview APIs because they accept `maxItems` up to 8 and `buildSuggestedAgenda` slices to the supplied value.
