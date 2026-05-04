# Gaps

- `npm audit --omit=dev` fails on a moderate PostCSS advisory through `next@15.5.15`'s transitive `postcss@8.4.31`. This is not blocking T01 because the scaffold does not process attacker-supplied CSS and npm's suggested force fix is a breaking Next downgrade, but it should be tracked until an upstream-safe Next/PostCSS update is available.
- Unit tests are intentionally absent for T01. Future feature/domain tasks should add Vitest coverage once business logic, server helpers, or shared contracts exist.
- `/login` and `/create-household` are linked but not implemented in T01. Downstream auth/UI tasks own those routes.
- The generated icon routes are dynamic edge endpoints. This is build-safe on Vercel, but future asset work can replace them with static checked-in icons if install icon performance or deterministic binary assets become important.
