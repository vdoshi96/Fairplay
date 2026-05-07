# Crash Course Redesign Responsibilities

Branch Manager D owns the crash-course learning surface for this repair pass.

## Owned Files

- `src/components/crash-course/crash-course-content.ts`
- `src/components/crash-course/crash-course-flow.tsx`
- `src/components/crash-course/crash-course-flow.test.tsx`
- `docs/agents/tasks/2026-05-07-crash-course-redesign/*.md`

## Scope

- Redesign crash-course lesson copy using the local Fair Play and A Better Share reports as conceptual research.
- Keep product language practical, non-clinical, non-shaming, and original.
- Improve the lesson layout so the text panel sits over or adjacent to the generated crash-course art in the same viewport.
- Preserve the immersive route behavior, existing generated image assets, progress callbacks, skip, completion, and mobile responsiveness.

## Out Of Scope

- No image generation. Existing Qwen-generated assets remain in use.
- No changes to shared app shell, data models, onboarding persistence, or non-crash-course routes.
- No source prompt/script copying from book reports or references.

