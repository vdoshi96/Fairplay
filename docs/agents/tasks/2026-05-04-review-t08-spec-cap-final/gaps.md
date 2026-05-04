# Gaps

No blocking spec gaps found in this final agenda-cap review.

## Residual Notes

- Direct service tests explicitly cover high and negative `maxItems`; zero, `NaN`, and infinity are covered by the shared normalizer implementation rather than by separate named tests.
- The build still emits the existing Next.js warning: using Edge Runtime on a page disables static generation for that page. This was present in prior reviews and is not a T08 agenda-cap blocker.
