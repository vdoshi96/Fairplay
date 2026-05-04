# Learned

- `NewCheckInLauncher` uses `POST /api/check-ins` for agenda preview. The service creates an active check-in on that POST, so removing previewed items in the client does not affect the already-created database check-in.
- `checkInService.create` resumes any active check-in before applying submitted agenda ids, which preserves resume semantics but makes preview removal ineffective after the first POST.
- `checkInService.updateItem` verifies the parent check-in belongs to the session household, but the Prisma update path scopes only by `itemId`; it does not require the item to belong to that checked-in household/check-in.
- `recordDecision` verifies the `itemId` is part of the loaded check-in before creating a decision, but the decision form exposed by the UI only captures decision type, summary, and review date.
- The generated summary helper avoids score, winner/loser, diagnosis, blame, and failure language and formats decisions, deferred items, and skipped items in calm factual sections.
- The T08 implementation artifacts document the route-mocked Playwright check-in flow as not DB-backed.
