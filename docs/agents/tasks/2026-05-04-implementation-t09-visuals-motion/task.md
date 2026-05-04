# T09 Visual Assets and Motion Integration

## Scope

Implementation worker T09 adds approved Fairplay visual placeholders and lightweight reduced-motion-safe motion hooks.

## Ownership

- Create `public/assets/fairplay/**` from approved `docs/assets/visuals/*.svg`.
- Create `src/components/visuals/**`.
- Create `src/components/motion/**`.
- Modify `src/app/globals.css`.
- Lightly integrate visuals in owned feature components under app shell, onboarding, responsibilities, radar, and check-ins.
- Add component and e2e visual smoke tests.

## Guardrails

- Do not consult private `References/` files.
- Do not copy source-like card, deck, board-column, worksheet, or public app visuals.
- Keep visuals supportive and non-obstructive.
- Respect `prefers-reduced-motion`.
- Preserve other agents' work and avoid auth/session/server/data contract changes.
