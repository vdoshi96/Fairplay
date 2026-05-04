# Gaps

## Blocking

1. Agenda preview/removal does not match the user flow.
   - The "Preview agenda" button calls `POST /api/check-ins`, and that route creates an active check-in.
   - Removing an item from the preview only changes local client state. A later "Start check-in" call returns the already-active check-in before applying the reduced selected ids.
   - This violates the requirement that agenda creation suggest items and let users remove or skip any suggested item before the guided check-in starts.

2. Item updates are not fully scoped to the household check-in.
   - The service verifies that `checkInId` belongs to the session household, but the Prisma `checkInItem.update` uses only `where: { id: input.itemId }`.
   - A caller with one valid household check-in id and a different household's item id could mutate the other household's item state/response.
   - This violates the cross-household access rejection requirement.

3. The guided UI does not provide explicit structured controls for responsibility owner/effect decisions.
   - The decision form exposes decision type, free-text summary, and review date only.
   - The server can apply structured responsibility effects when supplied by API clients, but the T08 guided UI does not let the user explicitly choose an owner, role, cadence, status, standard, or visibility update.
   - This falls short of the guided check-in user flow requirement to capture who carries the outcome until next review and the T08 requirement for explicit decision updates.

## Non-Blocking Notes

- Recent responsibility changes are not currently a distinct agenda source; the implemented responsibility query covers due reviews only. This should be handled with the same agenda refinement work, but the open-radar/due-review/core flow is present.
- T08 route-mocked e2e is documented as not DB-backed, which is acceptable as long as it is not represented as full persistence verification.
- No source-derived wording, clinical framing, score labels, winner/loser labels, or defer/skip-as-failure language was found in T08 user-facing copy.
