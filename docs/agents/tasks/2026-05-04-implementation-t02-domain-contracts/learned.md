# Learned

- T02 can stay fully platform-neutral by using Zod and TypeScript-only modules with no React, browser storage, server, or Prisma dependency.
- Vitest in the current scaffold does not resolve the `@/*` TypeScript path alias, so new test-covered shared modules use relative imports.
- Private radar publishing is safest as a dedicated mutation; generic radar updates should not be able to change visibility without transition context.
- The seed boundary is intentionally tiny: eight area keys and eight reviewed example titles only.
