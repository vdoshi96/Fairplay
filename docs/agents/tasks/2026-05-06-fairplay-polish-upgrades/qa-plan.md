# QA Plan

## Branch Gates

- Theme branch: Settings tests, theme provider tests, selected component regressions, lint, typecheck, dark-mode Playwright screenshot smoke.
- Greg branch: Library manager tests, CardLibrary tests, guide content tests, guided-learning E2E, asset validation.
- Little Alex branch: contracts, repository, route, Settings, AppShell, physics tests, Little Alex E2E, Prisma validate/generate.

## Visual QA

- Capture screenshots in dark mode for login/create persona flow and protected app pages including Home, Library, Load Map, Radar, Check-ins, and Settings.
- Inspect screenshots with vision before merge and after final mainline merge.
- Record screenshot paths and any fixes in `final-qa.md`.

## Final Main QA

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
```

Then push and verify local and GitHub SHAs match.
