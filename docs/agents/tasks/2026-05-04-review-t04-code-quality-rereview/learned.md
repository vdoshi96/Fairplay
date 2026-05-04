# Learned

## 2026-05-04

- Login now always routes non-throttled credential checks through `verifyPassword`, using a maintained dummy Argon2id hash when a household or credential is missing.
- The password verification helper now fails closed for malformed, unsupported, or corrupted stored hashes by returning `false`.
- Cookie max-age handling is safer when it avoids truthiness fallbacks: expired sessions become `Max-Age=0`, while invalid expiration inputs are rejected instead of becoming active cookies.
- Focused route tests can prove the constant-work call path without relying on brittle wall-clock timing assertions.
