# Learned

- T08 now has substantially better service/API/component coverage than the initial implementation, including preview behavior, agenda caps, household item scoping, structured decision effects, and neutral summaries.
- The current check-in e2e remains route-mocked; it verifies accessible browser interactions against handcrafted HTML, not the production component or API stack.
- The service entry points generally pass `householdId` from the authenticated session and require a selected persona, but decision recording still trusts caller-supplied responsibility ids/effects more than the agenda item relationship.
- Decision recording is split across decision creation, item state update, responsibility side effects, and radar side effects. That split creates real partial-write and duplicate-submit risks.
- The guided UI uses semantic controls and labels, but the active check-in flow does not surface mutation failures or manage focus for errors.
