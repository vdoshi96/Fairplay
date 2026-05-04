# Handoff

## Status

Implementation complete; required verification passed and pushed.

## What Changed

- `ResponsibilityUpdateSchema` no longer accepts direct `visibility` updates.
- `ResponsibilityVisibilityMutationSchema` now models visibility changes with `fromVisibility`, `toVisibility`, `confirmedVisibilityChange`, and optional `confirmationText`.
- Private-to-`shared_household`, private-to-`partner_visible`, and private-to-`check_in_only` transitions fail without confirmation and pass with confirmation.

## Review Focus

- Confirm the responsibility contract mirrors the intended radar visibility-safety pattern.
- Confirm existing create/update responsibility behavior is preserved except for direct update visibility changes.
