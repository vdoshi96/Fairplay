# Library action reliability work log

## Scope

- Fixed the real responsibility detail/editor flow after putting a Library card in play.
- Did not introduce a `Track for later` label; no current production label existed for that action.

## Changes

- Added editor feedback for Save, status changes, archive, and radar flag actions.
- Checked `fetch` responses and surfaced API error text when available.
- Stopped assignment and visibility follow-up writes when the primary save request fails.
- Added explicit unavailable copy to card detail actions when callbacks are not wired.
- Added Back to library and Back to Load Map links to the responsibility detail page.

## TDD

- First added failing tests for missing editor feedback and disabled card action copy.
- Then implemented the smallest matching UI/request handling changes.
