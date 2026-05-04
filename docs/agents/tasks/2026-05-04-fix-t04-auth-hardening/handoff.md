# Handoff

## Status

DONE

## Summary

Focused T04 auth hardening fixes completed for the code-quality review findings.

## Changes

- Added a maintained dummy Argon2id hash matching current password metadata and used it for missing household/credential login attempts.
- Updated login to always run one password verification before returning the generic invalid-credentials response, except for throttle short-circuiting.
- Updated `verifyPassword` to return `false` for malformed, corrupt, or unsupported stored hashes.
- Updated `setSessionCookie` to use the computed `maxAge` directly, set `0` for immediate/past expirations, and throw on invalid expiration inputs.
- Added focused tests for absent usernames, malformed stored hashes, and future/immediate/past/invalid cookie expirations.

## Verification

- `git status --short` before changes: clean.
- Red focused run: `npm test -- --run src/server/auth src/app/api/auth/login` failed with the expected 6 regressions.
- Green focused run: `npm test -- --run src/server/auth src/app/api/auth/login` passed with 6 files and 18 tests.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test -- --run src/server/auth src/app/api/auth src/app/api/personas`: passed with 9 files and 22 tests.
- `npm test -- --run src/middleware.test.ts`: passed with 1 file and 3 tests.
- `npm run build`: passed; Next.js emitted the existing edge-runtime static-generation warning.
- `git diff --check`: passed.
- `git status --short` before commit: focused auth hardening code/tests and task documentation changes only.

## Notes

- Generic login errors are preserved.
- Secure cookie flags remain unchanged.
- No sensitive password, hash, or token values are added to responses.
