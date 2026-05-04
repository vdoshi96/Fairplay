# T05 Auth, Onboarding, And App Shell UI

## Assignment

Build the mobile-first app shell, shared household auth UI, persona selection, onboarding, home, and settings screens for Fairplay v1.

## Owned Scope

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/create-household/page.tsx`
- `src/app/(auth)/choose-persona/page.tsx`
- `src/app/app/layout.tsx`
- `src/app/app/home/page.tsx`
- `src/app/app/onboarding/page.tsx`
- `src/app/app/settings/page.tsx`
- `src/components/app-shell/**`
- `src/components/auth/**`
- `src/components/onboarding/**`
- `src/components/settings/**`
- `src/app/page.tsx`
- T05 e2e tests and task docs

## Requirements

- Root `/` redirects by session state: signed out to `/login`, signed in without persona to `/choose-persona`, signed in with persona to `/app/home`.
- Auth forms preserve non-sensitive fields on recoverable errors and clear passwords.
- Login failure copy is generic.
- Persona selection shows only Alex and Max and submits through `/api/personas/select`.
- App shell shows active household/persona and mobile bottom nav for Home, Load Map, Radar, Check-ins, Settings.
- Onboarding uses original practical planning copy and includes the unsafe relationship caution.
- Settings shows household name, active persona, logout, neutral future data-controls note, and confirmation before persona switching.
