# Load Map Dashboard Corrective

## Owned Scope

- `src/components/responsibilities/responsibility-load-map.tsx`
- `src/components/responsibilities/responsibility-load-map.test.tsx`
- Branch notes under `docs/agents/tasks/2026-05-07-load-map-dashboard-corrective/`

## Goals

- Redesign the Load Map page as a compact responsive dashboard.
- Keep filters grouped and usable across mobile and desktop widths.
- Prevent accidental horizontal overflow outside the intentional board lane scroller.
- Make diagnostic tiles livelier and resilient to long values.
- Preserve Alex and Max user-facing labels and keep the dummy Load Map workflow working.

## Out Of Scope

- Global AppShell and navigation changes.
- Little Alex, AI, Crash Course, and non-Load Map responsibility surfaces.
