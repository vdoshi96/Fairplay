# Learned

- The idle-refresh fix updates `lastSeenAt` only after a session is found and passes revoked, idle-expiration, and absolute-expiration checks. Missing cookies and inactive sessions do not trigger activity writes.
- The auth repository boundary is doing the important household scoping for persona selection; the route passes the current session household into that boundary.
- The login route uses a generic response body for wrong-password and throttled paths, but the missing-household path skips Argon2 verification work. That still creates a practical username-enumeration timing side channel.
- `@node-rs/argon2` exposes typed `Algorithm` and `Version` constants. T04 currently uses numeric values that work, but importing the constants would make the parameter metadata less fragile.
- Cookie helpers are centralized enough that production cookie posture can be fixed and tested in one place.
