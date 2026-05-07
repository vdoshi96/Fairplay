# Layout background corrective work log

## Scope

- Prioritized a minimal mergeable shell/background/Little Alex safe-area patch after orchestrator status check.
- Stayed inside global responsive shell/background/page framing, Home action cleanup, FeatureGuide action placement, and Little Alex bounds.
- Did not touch AI generation backend or Crash Course content.

## TDD

- Added failing focused tests for route-level `PageShell` backgrounds on Home and Settings.
- Added failing Little Alex bounds tests for mobile bottom navigation reserve and desktop sidebar/bottom safety reserve.
- Added a focused FeatureGuide launcher placement test for a stable action wrapper.

## Changes

- Added shared layout metrics and matching CSS variables for sidebar width, bottom nav height, safe-area padding, content bottom padding, and Little Alex reserves.
- Added reusable `PageShell` background mappings and route lookup for protected pages.
- Wired standard `AppShell` routes to `PageShell` backgrounds while leaving Crash Course immersive.
- Removed the redundant Home top-row `Learn a feature` link while preserving Crash course, Card library, and the Learn a feature section.
- Kept FeatureGuide launch buttons inside a stable `data-feature-guide-action="primary"` wrapper.
- Updated Little Alex play-area bounds so the physics object avoids the desktop sidebar and mobile bottom nav reserve.

