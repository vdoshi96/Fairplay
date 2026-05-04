# Learned

- `@node-rs/argon2` throws for malformed stored hashes, so the auth-facing wrapper must catch parser/format errors and return `false`.
- Next cookie serialization preserves `Max-Age=0` when passed directly; the unsafe behavior came from the local `maxAge || default` fallback.
- A route-level mock around `verifyPassword` can prove the missing-username path performs verifier work without relying on timing assertions.

