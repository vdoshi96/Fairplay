# Product Surface Cleanup Task

## Request

Fix three partner-facing product issues:

- Let users discard a generated AI card draft when they decide not to use it.
- Remove the Radar section and Radar links/copy from app pages because it feels too formal for partner use.
- Let users restart the crash course after it has already been completed.

## Scope

- Library AI draft tracker and review panel.
- AI draft service/repository discard guards.
- App shell navigation, home learning hub, onboarding guide, guided feature content, Load Map filters/signals, responsibility editor/card actions, Check-ins empty agenda copy, crash-course learning path/copy, and the retired Radar page route/component.
- Product and implementation docs that describe current user-facing behavior.

## Out Of Scope

- Database schema removal for legacy Radar tables.
- API contract removal for Radar-related check-in data.
- Migration of existing persisted Radar rows.
- New visual asset generation.
