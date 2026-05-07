# Helper QA Checklist

## Automated

- `npm test -- src/components/little-alex/little-alex-physics.test.tsx --run`
- `npm test -- src/components/app-shell/app-shell.test.tsx src/components/settings/settings-panel.test.tsx --run`
- `npm test -- src/server/ai/little-alex-sprite-assets.test.ts --run`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e -- little-alex-physics.spec.ts` verifies settled sprite loading, visible fling/recovery limb attachment, viewport containment, saved tone propagation, reduced-motion behavior, and presentation screenshots.

## Manual Browser QA

Use a protected app route such as `/app/home`.

1. Confirm Little Alex spawns in the same default neutral standing pose.
2. Wait for idle standing and walking. Confirm speed and direction still feel unchanged.
3. Drag slightly and release. Confirm no chat bubble for a simple click/release.
4. Drag/fling with speed. Confirm the existing phrase bubble appears.
5. During fling, confirm arms and legs visibly flail.
6. Bounce off left, right, top, and bottom bounds. Confirm limbs react but torso/root trajectory still bounces normally.
7. Watch recovery. Confirm the helper returns cleanly to neutral standing after the existing timer.
8. Confirm no visible gaps at shoulders, hips, or neck during fling/recovery.
9. Open Settings and save each skin tone. Confirm the visible helper changes tone after refresh.
10. Check all three presentations with all five tones if time allows.
11. Confirm browser console has no errors.

## Visual Failure Signs

- Full-body sprite still appears rigid during fling with no visible limb motion.
- Limbs float separately from torso.
- Neck, shoulders, or hips show empty space.
- Skin tone changes only the settings swatch, not the helper.
- Skin recolor affects suit, hair, outlines, or clipboard.
- Full-body and limb sprites disagree on tone.
