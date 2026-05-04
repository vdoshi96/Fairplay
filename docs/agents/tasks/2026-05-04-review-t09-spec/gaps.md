# Gaps

- Visual e2e remains route-mocked because DB-backed protected app route rendering was unavailable in the T09 worker context. This caveat is documented and is not blocking for T09.
- Reduced-motion support exists in CSS, but there is no browser-level Playwright assertion using reduced-motion media emulation. This is a future coverage improvement, not a blocking spec finding.
- Final production illustration polish and PWA export-size review remain future visual work, consistent with `docs/product/visual-system.md`.
