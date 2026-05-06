# Little Alex Upgrades

## Responsibility

Branch: `codex/fairplay-little-alex-upgrades`

This branch owns the global Little Alex behavior, appearance customization, and persona-scoped preference persistence.

## Implemented

- Increased Matter.js gravity and fling velocity by 10%.
- Added a fling speech bubble with a configurable 30-character phrase.
- Added idle behavior: after 5 seconds untouched, Little Alex stands upright, walks along the bottom of the viewport, pauses every 5 seconds, and faces recent pointer/touch activity.
- Added gender presentation, skin tone, and phrase settings for the selected persona.
- Added a black suit, white shirt, bowtie, shoes, and clipboard to every Little Alex appearance option.
- Added reduced-motion fallback that keeps the assistant draggable without continuous animation.
- Added a dedicated `/api/preferences/little-alex` route and Prisma-backed `PersonaLittleAlexPreferences` storage.

## QA

- `npm run prisma:generate`
- `npm run prisma:validate`
- `npm test -- src/contracts/preferences.test.ts src/server/repositories/preferences.test.ts src/app/api/preferences/little-alex/route.test.ts src/components/settings/settings-panel.test.tsx src/components/app-shell/app-shell.test.tsx src/components/little-alex/little-alex-physics.test.tsx`
- `npm run typecheck`
- `npm run lint`
- `npm run test:e2e -- little-alex-physics.spec.ts`

## Blockers

- None currently known.
