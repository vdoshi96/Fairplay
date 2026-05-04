# Learned

- `MAX_AGENDA_ITEMS` is now shared between create and preview route schemas and the agenda builder.
- The create and preview routes reject `maxItems: 8` before calling the service.
- `buildSuggestedAgenda` clamps above-five values with `Math.min(options.maxItems ?? MAX_AGENDA_ITEMS, MAX_AGENDA_ITEMS)`, but negative numbers are still passed to `Array.prototype.slice` as negative end indexes.
- With the repository source queries allowing up to 5 radar items plus 5 responsibilities, `maxItems: -1` can return 9 items through direct service calls even though T08 requires a max of 5.
- The non-mutating preview endpoint still avoids `getActiveCheckIn` and `createCheckIn`.
- `NewCheckInLauncher` still starts with selected ids derived from the current preview list and filters linked radar responsibility ids out of responsibility agenda selection.
- Item updates still load the household check-in, verify the nested item, and persist by both `itemId` and `checkInId`.
- The guided UI still sends structured responsibility owner/review-date effects for responsibility owner decisions.
