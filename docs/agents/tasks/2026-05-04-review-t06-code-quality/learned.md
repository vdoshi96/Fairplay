# Learned

- T06 now resolves the earlier spec issues around relevant days, non-private visibility controls, linked radar-backed filtering, and area/hidden-effort summary display.
- The shared `ResponsibilityUpdateSchema` still includes `status` and `currentAssignments`, even though T06 has dedicated status and assignment routes with stronger validation and event semantics.
- The load-map overview links radar items using `responsibilityId` and `state`, but its repository query reads every radar item in the household rather than applying persona-private radar visibility filtering.
- Private radar flags created from the responsibility editor become `draft` radar items. Because the load-map linked-radar logic treats any non-`resolved` state as active, those private drafts can affect flagged filtering when included in overview data.
- The Playwright responsibility flow is intentionally route-mocked and passes, but it tests handcrafted route HTML and script behavior rather than production React components or API persistence.

