# Gaps

- The login path needs a constant-work missing-user branch, usually via a versioned dummy Argon2id hash, so invalid usernames and wrong passwords for real households are indistinguishable by response timing.
- `verifyPassword` needs malformed/corrupt hash handling and tests so login keeps returning the generic auth failure instead of surfacing a 500 for bad stored credential data.
- `setSessionCookie` needs expiration edge-case tests. It should not convert an expired, immediate, or invalid expiration into a fresh 30-day cookie.
- API route tests cover the main happy paths and several high-risk failures, but they are still thin around invalid JSON/input, unauthenticated persona selection, cookie attributes, and the missing-user login path.
- Live DB-backed API flow verification was not part of this review command set; repository integration coverage remains the deeper end-to-end guard for persistence behavior.
