# Handoff

## Completed

- Ready generated AI drafts can be discarded before acceptance.
- Accepted drafts remain protected from discard.
- The Radar page route and Radar board component have been retired from the app surface.
- Radar links/copy/actions were removed from current app pages and learning flows.
- Completed crash-course users can restart from lesson one.

## Files To Review First

- `src/components/library/ai-task-manager.tsx`
- `src/server/ai-card-drafts/service.ts`
- `src/server/repositories/ai-card-drafts.ts`
- `src/components/crash-course/crash-course-flow.tsx`
- `src/components/crash-course/crash-course-page-client.tsx`
- `src/components/responsibilities/responsibility-load-map.tsx`
- `src/components/guide/guide-content.ts`

## Rollback

- Revert this branch or restore the deleted Radar page/component if the product wants Radar back.
- To roll back only ready-draft discard, remove ready-state `Discard` controls and remove `ready` from the delete allowlists in service/repository.
- To roll back only crash-course restart, remove `onRestart` from `CrashCourseFlow` and its page-client handler.
