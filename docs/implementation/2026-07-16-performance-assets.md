# Performance, Bundle, And Asset Efficiency

## Scope

This milestone reduces repeated database, session, browser, physics, and image work without changing routes, persisted responsibility behavior, session security rules, or card workflow semantics.

## Server and persistence behavior

- Households now carry a nullable catalog-version marker. Existing households reconcile once after migration; current-version overview requests return before any template or responsibility write. The marker advances only after reconciliation completes, so failed or concurrent attempts remain retry-safe.
- Responsibility overview reads select summary fields and current assignments only. Responsibility details and editors retain complete assignment history, notes, lifecycle notes, and timestamps.
- Current-session resolution is memoized per React server request. `lastSeenAt` uses a conditional write at most once every five minutes while preserving revocation, idle expiration, absolute expiration, persisted expiration, opaque tokens, and selected-persona behavior.

## Client and asset behavior

- Board, Deal, and Your Deck import route-specific client entries with shared card-cover, card-back, search, and transition helpers. The compatibility `CardWorkspace` export remains for callers outside app routes.
- The former 46,160-byte all-view card chunk is no longer emitted. Raw route-only JavaScript is 9,664 bytes for Board, 21,665 bytes for Deal, and 13,925 bytes for Your Deck.
- Little Alex's Matter.js implementation loads only after a desktop-width, hover-capable, fine-pointer media query matches. The runner pauses while the document is hidden and while the character is settled, standing, being dragged, or in reduced-motion mode.
- Matter.js is absent from initial app-route chunks and remains in two lazy chunks: an 83,148-byte vendor chunk and a 25,675-byte physics chunk.
- Generated operational/auth backgrounds now have local 768/1536 AVIF and WebP variants with a PNG fallback. The 36 variants total 685,272 bytes versus 17,090,070 bytes for their source PNGs. Onboarding, authentication, page shells, Settings, and Check-ins use the responsive layer.
- Local card covers use responsive Next image optimization. Authenticated `/api/` covers remain unoptimized so the server image optimizer never attempts an unauthenticated fetch.
- Global CSS is split, in preserved cascade order, into Tailwind boundary, tokens/theme, shell/background, motion, Little Alex, and final reduced-motion layers. No visual values or compatibility overrides were removed.

## Compatibility and safety

- The catalog marker migration is additive and nullable; it does not rewrite responsibility data or rename catalog identities or persisted lanes.
- Detail/editor payloads, distribution responses, assignment history, and session expiration rules are unchanged.
- No API keys, live AI generation, or private reference material were used.

## Verification

- Local Postgres readiness, Prisma validation/client generation, and `prisma migrate dev --skip-seed`; the schema and migration history are in sync.
- ESLint, TypeScript, and `git diff --check`.
- Full Vitest: 106 files / 637 tests, including DB-backed persistence and catalog reconciliation.
- Production Next.js build: 38 static pages generated and the complete route table emitted.
- Full Chromium Playwright: 31/31 scenarios, including a mobile production-network gate that requests responsive auth artwork and optimized card covers, keeps Available Cards at 20 mounted rows when expanded, and proves no Matter.js chunk is requested.
- Responsive rendered evidence covers 320, 390, 768, 1024, 1280, and 1366 widths, 200% zoom-equivalent layouts, light/dark surfaces, and current Little Alex sprite captures under ignored `test-results/`.
- Three independent reviews returned ship-ready after one direct onboarding PNG bypass was found and corrected before the final build.
