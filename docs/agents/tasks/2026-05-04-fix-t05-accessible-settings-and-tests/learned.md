# Learned

- The existing persona-switch confirmation used `role="dialog"` and `aria-modal="true"` on a visual overlay, but it did not move focus, trap focus, handle Escape, or restore focus.
- The existing auth/onboarding Playwright flow mocked protected documents with fixture HTML, which kept e2e independent of unavailable DB state but did not exercise real protected UI.
- AppShell, onboarding, home, and settings can be rendered as component tests with representative household/persona props, which exercises the real UI without reaching server repositories.
