# Learned

- T05 keeps auth forms as client components and keeps protected session lookup in server-rendered pages/layouts, which is appropriate for Next App Router.
- Login and create-household forms clear password state after failures while preserving non-sensitive fields.
- Root and `/app/**` redirects are build-safe in the current implementation; `npm run build` completed and listed the expected dynamic routes.
- The settings confirmation dialog currently looks modal but does not implement keyboard-modal behavior.
- The Playwright suite uses API route mocks plus full-document HTML fixtures for protected pages, which limits its value as UI regression coverage.
