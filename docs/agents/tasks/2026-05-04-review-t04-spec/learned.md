# Learned

- T04 correctly uses Argon2id metadata matching the plan: algorithm `argon2id`, memory cost `19456`, time cost `2`, parallelism `1`, hash length `32`, params version `v1`.
- The route responses reviewed do not return password hashes, raw session tokens, or credential records.
- Session cookies carry the opaque raw token, while Prisma session storage is keyed by `tokenHash`.
- Cookie defaults match the T04 contract: `AUTH_COOKIE_NAME` fallback `fairplay_session`, `HttpOnly`, production-only `Secure`, `SameSite=Lax`, `Path=/`, and max age derived from absolute expiration.
- Persona selection is household-scoped by repository checks and supports explicit switching through the same route.
- No production code usage of `localStorage` or `sessionStorage` was found.
- The implementation documents its own last-seen gap in the T04 worker `gaps.md`; spec review treats this as blocking because idle expiration must reflect recent authenticated activity.
