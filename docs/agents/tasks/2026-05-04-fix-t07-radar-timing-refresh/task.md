# Task

Fix the T07 radar spec-review findings for persisted timing fields and visible board refresh after mutations.

## Scope

- Add minimal persisted radar timing fields for desired timing and deferred revisit date.
- Wire timing fields through radar contracts, Prisma, repository/service, API routes, and UI.
- Update the production radar board after successful create, publish, defer, resolve, dismiss, and schedule mutations.
- Add focused regression coverage for timing persistence/mapping and board state updates.

## Out of Scope

- Auth internals.
- Responsibility editor/load-map internals.
- Check-in feature internals beyond existing radar target check-in wiring.
- Private reference files.
