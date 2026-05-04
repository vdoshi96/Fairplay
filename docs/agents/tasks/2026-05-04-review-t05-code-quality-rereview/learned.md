# Learned

- `SettingsPanel` now uses `aria-modal="true"`, `aria-labelledby`, `aria-describedby`, background `aria-hidden`, and `inert` while the persona-switch dialog is open.
- Focus is moved into the dialog on open, contained between Continue and Cancel on Tab/Shift+Tab, and restored to the Switch persona trigger after Cancel or Escape.
- The route-mocked Playwright auth/onboarding flow remains intentionally DB-independent, but real protected UI is now covered by component/page tests for AppShell, home, onboarding, and settings.
- Auth form fields remain controlled, preserve non-sensitive fields after recoverable errors, and clear password state on failed or successful submit paths.
- Static review found no `localStorage` or `sessionStorage` usage in `src/`.
