# Greg Taskmaster Avatar

## Scope

- Replace the Library AI capture sidekick with a static decorative Greg Taskmaster avatar.
- Keep the capture button text exactly `Greg - The Taskmaster`.
- Remove the local Little Alex image and speech text near the Library capture button.
- Update Library guide capitalization and regression coverage.

## Asset

- Source: `/Users/vishal/.codex/generated_images/019dfbec-6c45-7360-8cc8-a845960cdd65/ig_0e77dc20197ecfc70169fb60edb8288196bab6d7539fd11b46.png`
- Project PNG: `public/assets/fairplay/generated-ui/greg-taskmaster-avatar.png`
- Conversion: chroma-key removal helper with alpha PNG output.
- Registry: `src/server/ai/generated-ui-assets.ts` includes `greg-taskmaster-avatar`, so PNG file validation covers the committed asset.

## QA

- `file` and `sips` confirmed the project asset is a 1254 x 1254 RGBA PNG with alpha.
- `npm test -- src/components/library/ai-task-manager.test.tsx src/components/library/card-library.test.tsx src/components/guide/guide-content.test.ts src/server/ai/generated-ui-assets.test.ts src/server/ai/generated-ui-asset-files.test.ts`: passed after reviewer fixes.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run test:e2e -- guided-learning.spec.ts`: 1 browser test passed.
