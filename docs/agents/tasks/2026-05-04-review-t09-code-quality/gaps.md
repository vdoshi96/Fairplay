# Gaps

- Non-blocking: `e2e/visual-responsive.spec.ts` is not an end-to-end proof of production visual stability because it route-fulfills simplified HTML/CSS instead of exercising real Next routes/components.
- Non-blocking: reduced-motion behavior is implemented in CSS, but there is no browser-level assertion with `reducedMotion: "reduce"` proving the production pages avoid looping motion.
- No DB-backed authenticated visual walkthrough was performed; the required visual/responsive Playwright run uses route mocks.
