# Learned

- The responsibility service scopes list/detail/status/assignment/radar operations through the active session household and delegates repository reads with household ids.
- Current assignments are derived from assignment history by filtering active assignments with `endsAt === null`.
- Load snapshot output is aggregate-only and does not expose score, winner/loser, grade, diagnosis, proof, or failure fields.
- The T06 e2e flow follows the current project pattern of route-mocking protected app flows because DB-backed protected flow verification remains unavailable locally.
- The main spec drift is in the client surface: the load map/editor UI does not yet expose all behavior promised by the T06 plan, and the edit route rejects the editor's existing PATCH payload.
