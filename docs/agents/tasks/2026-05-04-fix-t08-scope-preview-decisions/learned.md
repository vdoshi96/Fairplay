# Learned

- `NewCheckInLauncher` used `POST /api/check-ins` to preview agenda suggestions, which created or resumed an active check-in before the user removed suggestions.
- The service validated the parent check-in belongs to the household, but the Prisma item update path mutated `checkInItem` by `id` alone.
- The decision API already accepted `responsibilityEffect`, but the guided UI only captured decision type, free-text summary, and review date.
- Radar preview suggestions can carry a linked responsibility id; start payloads must filter selected ids by preview item type so a radar suggestion does not expand into an extra responsibility agenda item.
