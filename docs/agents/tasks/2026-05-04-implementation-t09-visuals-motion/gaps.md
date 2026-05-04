# Gaps

- Visual e2e smoke tests use route-mocked protected pages because local DB-backed protected route rendering is unavailable in this worker context.
- This task uses approved placeholder SVGs only; production illustration/export polish remains future visual work.
- Reduced-motion behavior is covered by CSS and component hooks, but no browser-level reduced-motion media emulation assertion was added in this pass.
