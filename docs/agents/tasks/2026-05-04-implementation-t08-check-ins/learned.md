# Learned

- T03 had already provided a low-level check-in repository, but the guided T08 behavior still needed a service layer to enforce selected-persona, household scoping, explicit decision effects, and calm summary generation.
- T06 responsibility service exposes public mutation methods for assignments, status, visibility, and generic editable fields; T08 can route explicit decisions through those methods without editing responsibility internals.
- T07 radar service exposes dedicated transitions; T08 resolves a radar item only after an explicit decision path, not after plain skip/defer/item updates.
- Adding the real `/app/check-ins` route caused Next.js lint to start enforcing the existing home link as an internal route.
