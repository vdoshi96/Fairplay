# QA Plan

## Per Branch

Each branch must run focused unit/component tests for its files and at least one route-level or Playwright smoke test when the feature has visible behavior.

## Merge Order QA

1. Theme/login: auth form tests, settings tests, theme provider tests, auth onboarding Playwright smoke.
2. Integrated art: AI generator prompt tests, AI task manager tests, card detail tests, responsibility contract/repository tests, generated-art Playwright smoke.
3. Learn-by-doing: guide tests, page practice harness tests, guided-learning Playwright suite.
4. Little Alex physics: app shell tests, physics component tests, little-alex Playwright drag/fling smoke.

## Final Main QA

Run from merged `main`:

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

Record command outputs and any residual risks in `final-qa.md`.
