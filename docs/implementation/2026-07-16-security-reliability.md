# Security, Reliability, And Cross-Browser Verification

## Scope

This milestone hardens browser request boundaries, protects household creation before expensive work, and expands the release matrix without changing routes, authentication semantics, household data, or product language.

## Request and session boundaries

- Middleware now creates one random nonce per document request, forwards the nonce and matching Content Security Policy to the App Router, and returns the same policy with centralized frame, referrer, permissions, and content-type protections.
- The deterministic theme bootstrap receives the request nonce. A real-browser assertion proves the response policy nonce and rendered bootstrap `script.nonce` match.
- Cookie-authenticated unsafe methods require an exact same-origin `Origin`; malformed, missing, null, and cross-origin values fail with `403` and `no-store`. Safe reads and unauthenticated login/household creation remain available.
- Malformed fallback cookie encoding fails closed instead of throwing in middleware.
- Production session cookies remain `Secure` by default. The local Playwright production server can opt into a non-secure cookie only through an explicit flag combined with an HTTP loopback `APP_BASE_URL`; deployed, invalid, missing, and non-loopback origins remain secure.

## Household-creation protection

- Household creation rejects a declared or streamed body above 8 KiB before JSON parsing, Argon2id, session creation, or database work. UTF-8 bytes are counted rather than JavaScript characters.
- A bounded process-local fixed-window limiter permits 32 attempts per privacy-hashed client and 64 accepted attempts per process every 15 minutes, with at most 2,048 tracked client buckets plus one overflow bucket.
- Client and process quota updates commit together. An attempt rejected by either gate does not drain capacity from the other gate or block unrelated clients.
- Rejections use generic `400`, `413`, or `429` responses; throttled responses include `Retry-After`.
- The limiter deliberately remains process-local. Multi-instance production deployments should add a shared edge or datastore-backed limiter if coordinated global enforcement is required.

## Browser and accessibility coverage

- Playwright now has Chromium, desktop WebKit, iPhone WebKit, and touch Chromium projects.
- The cross-browser core scenario creates a household, chooses Alex, assigns a real Deal card, verifies it on Board, schedules a Check-in, and scans settled mutation states.
- Axe is scoped to WCAG 2.0, 2.1, and 2.2 A/AA tags. Every scoped violation fails the test and each scan attaches its complete JSON report.
- The mobile performance scenario belongs only to the touch project and uses its page fixture, so video settings and device configuration are not bypassed.
- The transient Deal movement surface now uses an opaque high-contrast background; accessibility scans wait for finite UI motion to settle instead of sampling mid-animation opacity.

## Verification

The completed ladder passed with AI-provider variables explicitly blank:

```bash
npm run db:wait
npm run prisma:validate
npm run prisma:generate
npm run prisma:migrate -- --skip-seed
npm run lint
npm run typecheck
npm test -- --run --maxWorkers=4
npm run build
npx playwright test --workers=1
```

- Prisma schema and migrations were already synchronized.
- Vitest passed 110 files / 679 tests, including DB-backed integration coverage.
- The production Next.js build completed and emitted 38 pages plus middleware.
- Playwright passed 35/35 scenarios across all four projects in 1.2 minutes.
- Focused Little Alex drag/fling video passed in Chromium; the retained WebM is VP8, 800x450, 2.52 seconds, and 165,794 bytes.
- The connected iPhone 15 Pro Max was unavailable. An iOS 26.5 iPhone 17 simulator fallback manually verified Safari Add to Home Screen, the Fairplay name/icon, `Open as Web App`, Home Screen installation, and a standalone launch without Safari chrome.
- Two independent reviews found the final milestone ship-ready after quota-isolation, loopback-cookie, nonce-integration, navigation-race, and stable-animation findings were corrected.

The latest ignored QA evidence is under `test-results/`, including `little-alex-recording/` and `iphone-a2hs/`. No API keys, live AI-provider calls, or private `References/` material were used.
