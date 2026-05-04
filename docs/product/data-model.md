# Data Model Sketch

This is a planning sketch, not an implementation schema.

## Core Entities

- `Household`: shared workspace for a domestic group.
- `Member`: person participating in household planning.
- `Responsibility`: durable unit of household work.
- `Assignment`: current ownership and handoff expectations.
- `CheckIn`: dated review of responsibilities and balance.
- `ActivityEvent`: audit trail entry for meaningful changes.

## Open Modeling Questions

- Whether responsibilities should support templates in v1.
- How to represent shared ownership without hiding accountability.
- What history must be retained for trust and clarity.
