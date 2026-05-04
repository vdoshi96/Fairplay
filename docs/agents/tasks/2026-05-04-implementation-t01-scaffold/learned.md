# Learned

- The repository began with documentation only; T01 is the first application code scaffold.
- The existing `.gitignore` already excluded local env files, build output, Playwright output, and private `References/`.
- Next.js generated `next-env.d.ts` during checks; ESLint ignores it because it is generated.
- Vitest needs to exclude the Playwright e2e directory so `npm test -- --run` does not collect Playwright specs.
- The PWA baseline can be install-friendly with manifest and generated icons without introducing a service worker or offline data cache.
