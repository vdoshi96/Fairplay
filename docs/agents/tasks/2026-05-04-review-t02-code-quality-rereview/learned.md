# Learned

- The username boundary is now centralized in `HouseholdUsernameSchema`, which keeps create-household and login handlers from accepting values that normalize to empty or unsafe storage/throttle keys.
- Normalization now has test coverage for both successful canonicalization and the risky edge cases called out by the prior review: spaces-only, punctuation-only, too short, disallowed symbols, repeated separators, and mixed case/space/underscore inputs.
- Responsibility creation now matches the reviewed v1 product boundary: default shared-household creation remains ergonomic, while private responsibility drafts are rejected at the contract layer.
- The dedicated responsibility visibility mutation path survived the fixes, so private-to-visible transitions still carry source visibility and explicit confirmation context.
- The Vitest config now mirrors the TypeScript `@/*` import shape closely enough that future aliased test imports should not be blocked by test resolution.
- The shared domain, contract, and seed layer remains platform-neutral and small: Zod schemas are strict, load signals are aggregate-only, and seed/safety copy remains maintainable.
