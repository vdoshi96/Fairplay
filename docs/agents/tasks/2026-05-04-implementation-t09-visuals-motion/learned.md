# Learned

- Existing visual tokens and Tailwind color mappings were already present in `src/app/globals.css` and `tailwind.config.ts`, so no Tailwind config change was required.
- Protected app routes still depend on DB-backed auth/session state; visual e2e coverage needs route mocks, while component tests exercise real React components.
- The approved placeholder assets are intentionally small SVGs with embedded titles/descriptions; app usage still needs explicit `alt` or decorative empty alt handling at the component boundary.
