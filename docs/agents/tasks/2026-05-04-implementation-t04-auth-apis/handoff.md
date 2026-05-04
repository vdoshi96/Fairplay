# Handoff

## Status

Completed locally; ready for review.

## Notes

- Preserve T04 ownership boundaries.
- Do not use browser storage for household/session/persona data.
- Created household and login APIs set only the opaque raw session token in the HttpOnly auth cookie.
- Login uses generic failure copy for wrong username/password and throttled attempts.
- Persona selection delegates household membership enforcement to the scoped T03 session repository and maps cross-household persona ids to `403`.
- Middleware redirects `/app/**` by checking `/api/auth/me`, so it does not store persona state in browser storage.

## Verification

- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas` passed.
- `npm test -- --run src/middleware.test.ts` passed.
- `npm run build` passed.
- `git diff --check` passed.
