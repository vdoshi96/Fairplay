# Learned

- The visibility fix mirrors the safer radar pattern: ordinary update schemas do not carry visibility changes, and private-to-visible movement goes through a dedicated mutation with transition context.
- `ResponsibilityUpdateSchema` now rejects a direct `visibility` property because it is strict and built from editable responsibility fields with `visibility` omitted.
- The regression tests cover every requested target visibility: `shared_household`, `partner_visible`, and `check_in_only`.
- The earlier approved T02 surfaces still look aligned with the implementation plan: exact enum arrays, platform-neutral Zod contracts, deterministic username normalization, aggregate load signals, tiny approved-original seed content, and neutral non-clinical safety copy.
