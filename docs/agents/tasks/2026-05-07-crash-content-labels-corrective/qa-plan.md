# QA Plan

## Focused Automated

- `npm run test -- src/components/crash-course/crash-course-flow.test.tsx src/seed/fairplay-source-cards.test.ts src/components/library/card-library.test.tsx`
- `npm run test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-page-client.test.tsx`

## Broader Feasible Checks

- `npm run typecheck`
- `npm run lint`

## Manual Review Targets

- `/app/crash-course` desktop: lesson panel stays visually connected to the art and leaves right-side room for Little Alex.
- `/app/crash-course` mobile: lesson panel remains above the bottom nav and scrolls internally when content is tall.
- Library duplicate personal cards show Alex/Max labels while `player-1` and `player-2` slugs/assets remain intact.
