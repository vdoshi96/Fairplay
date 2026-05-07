# Work Log

## 2026-05-07

- Used Superpowers TDD/systematic debugging before implementation.
- Added red tests for ready-draft discard in the tracker, service, and repository.
- Added red tests asserting Radar no longer appears in the app shell, home feature learning cards, onboarding guide, crash course, guide helper/content, Load Map filters/signals, card detail actions, responsibility editor actions, and Check-ins empty agenda copy.
- Added red tests for restarting a completed crash course from the completion splash.
- Confirmed the focused suite failed for the expected missing behavior before implementation.
- Implemented ready draft discard by adding `Discard` actions in tracker/review UI and allowing `ready` status in service/repository delete guards while preserving `accepted` and `processing` protection.
- Removed partner-facing Radar UI, route, component, visual helper, nav/home links, page-shell background mapping, Load Map Radar filter/signal, and Radar action buttons.
- Updated crash-course content to route learners through Library, Load Map, and Check-ins; added a completed-state restart button wired to onboarding preferences.
- Updated current product docs and AI Task Manager implementation notes.

## Coordination Notes

- Two read-only sidecar auditors checked Radar references and AI discard/crash-course restart surfaces.
- No Qwen image generation was needed because this task did not create new visuals.
