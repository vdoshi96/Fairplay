# Gaps

- DB-backed create/login/persona/onboarding e2e verification remains unavailable in this environment; T05 coverage uses Playwright route mocks and component tests.
- The onboarding guide does not repeat the exact non-clinical boundary copy from `SAFETY_COPY.nonClinicalBoundary`; the boundary is shown on the create-household screen before account creation. This is not blocking for T05, but it is worth reconsidering if product wants the boundary specifically in onboarding.
- The app shell navigation includes future feature links for Load Map, Radar, and Check-ins before those routes exist. This matches the T05 shell handoff direction but should be closed by T06 through T08.
