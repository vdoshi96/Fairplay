# Gaps

- DB-backed repository integration verification was not part of the required command list for this review; prior handoff notes still apply for local Postgres availability.
- Tests do not cover invalid radar state transitions, stale timestamp cleanup when moving between deferred/scheduled/resolved/dismissed states, or mutation failure/pending UI behavior.
- The radar e2e test routes `/app/radar` to handcrafted HTML, so it does not verify the real Next.js page, API routes, or database-backed behavior.
