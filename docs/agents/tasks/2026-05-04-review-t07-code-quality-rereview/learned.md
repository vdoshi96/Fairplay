# Learned

- Removing transition-only fields from `RadarUpdateSchema` and whitelisting service update fields closes both API-level and direct service-call bypasses.
- The dedicated dismiss route now matches the existing transition-route pattern for publish, defer, resolve, and schedule.
- Transition cleanup is easiest to audit when each transition explicitly writes all stale metadata fields to either the new value or `null`.
- The radar board tests now cover the user-facing failure modes that were previously lossy: create input, edit state, publish dialog state, and transition context.
- The publish confirmation uses `aria-modal`, background inerting, initial focus movement, Tab wrapping, Escape/cancel close, and focus restoration, with regression tests.
