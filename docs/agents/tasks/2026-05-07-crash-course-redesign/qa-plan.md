# QA Plan

## Automated

- Run focused crash-course component tests:
  - `npm run test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-page-client.test.tsx`
- Run lint as feasible:
  - `npm run lint`
- Run typecheck as feasible:
  - `npm run typecheck`

## Manual Review Targets

- Desktop: lesson panel should sit adjacent to the background art, not below it.
- Mobile: lesson panel should overlay the lower part of the immersive scene and remain internally scrollable if copy is tall.
- Navigation: Previous, Next, Finish, Skip, and completion splash should retain behavior.
- Copy: confirm lessons stay practical, original, non-shaming, and do not copy source scripts or branded source terms beyond CPE.

## Rollback

- Revert `src/components/crash-course/crash-course-content.ts` to restore previous lesson copy.
- Revert `src/components/crash-course/crash-course-flow.tsx` to restore the prior centered panel layout.
- Revert `src/components/crash-course/crash-course-flow.test.tsx` to remove the added coverage/layout expectations.

