# Learned

## Responsibility Visibility Updates

- `ResponsibilityEditableFieldsSchema` was shared by create and update contracts, so `partial()` accidentally made direct visibility changes available in generic updates.
- Radar had the safer pattern already: separate generic update and visibility transition mutation.
- The shared `assertVisibilityTransition` helper is the canonical enforcement point for private-to-visible confirmation.

## Testing Notes

- The regression should cover both bypass prevention and the intended dedicated mutation path.
- A loop over the three publish targets keeps the test compact while explicitly checking `shared_household`, `partner_visible`, and `check_in_only`.
