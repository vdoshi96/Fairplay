# Learned

- T05 correctly keeps auth UI password handling client-side transient, clears password fields on submit failures, and does not introduce `localStorage` or `sessionStorage` usage.
- The e2e flow suite is intentionally route-mocked for API and protected app documents; the T05 handoff states this is mocked and not DB-backed verification.
- Onboarding includes the unsafe relationship caution from `SAFETY_COPY` and practical setup steps, while the explicit non-clinical boundary copy appears on the create-household screen rather than inside the onboarding guide.
- The app shell uses compact mobile navigation labels and persona state without importing a deck/card interaction metaphor.
