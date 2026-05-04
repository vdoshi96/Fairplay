# Handoff

## Status

`DONE`

## Notes

- Generic responsibility PATCH now rejects `status`, `currentAssignments`, and `visibility`; existing editor saves no longer send transition fields through PATCH.
- Dedicated assignment/status services and routes remain the transition paths, with added coverage for handoff/revisit context and status event persistence.
- Responsibility overview now requires a selected persona and loads linked radar items through persona-scoped radar visibility semantics.
- Production component/API/service coverage now covers editor submit shape, archive confirmation, assignment handoff context, load-map filters/summaries, and selected-persona overview behavior.
- Required verification passed: `npm run lint`, `npm run typecheck`, `npm test -- --run src/server/responsibilities src/components/responsibilities src/app/api/responsibilities`, `npm run test:e2e -- --grep "responsibility|load map"`, `npm run build`, and `git diff --check`.
