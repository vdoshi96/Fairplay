# Helper System

This directory documents Little Alex, the floating Fairplay helper/avatar.

## Current Architecture Snapshot

- `src/components/app-shell/app-shell.tsx` renders `LittleAlexPhysics` on protected app routes and passes `chatPhrase`, `genderPresentation`, and `skinTone` from persona-scoped preferences.
- `src/components/little-alex/little-alex-physics.tsx` owns rendering, Matter.js bodies, pointer drag/release, idle standing/walking, chat bubble display, viewport clamping, and reduced-motion behavior.
- `src/components/settings/settings-panel.tsx` owns the Little Alex settings UI and saves the selected presentation, phrase, and skin tone through `/api/preferences/little-alex`.
- `src/contracts/preferences.ts` defines the persisted preference schema. The current skin tones are `tone_1` through `tone_5`; the default is `tone_2`.
- `public/assets/fairplay/little-alex-sprites/` contains Qwen-generated presentation assets. It currently has full-body sprites for `neutral`, `masculine`, and `feminine`, plus legacy part sprites.

## Root Causes

### Ragdoll

The physics world already creates separate Matter.js bodies for head, torso, arms, and legs, joined by constraints. Those bodies move during drag/fling, but the visible helper is now a single full-body PNG that follows only the torso. The hidden body-part wrappers still exist and update, so the simulation can flail internally while users only see a rigid full-body sprite.

### Skin Tone

The settings and preference pipeline passes `skinTone` correctly into `LittleAlexPhysics`, but rendering applies it only as `--little-alex-skin`. That CSS variable affects the old CSS-rendered head. The visible full-body PNG uses `/assets/fairplay/little-alex-sprites/{presentation}-full.png`, which has a fixed embedded skin tone. As a result, the selector changes state but not the visible character.

## Implementation Direction

1. Preserve the current full-body sprite for settled, idle, walking, and reduced-motion states so the clean neutral pose does not change.
2. Add a small ragdoll visual state machine that reveals constrained body-part sprites only while fling/recovery is active.
3. Keep the torso/root on the existing Matter.js trajectory; limb visuals follow existing constrained child bodies with additional damping and bounded angular impulse where needed.
4. Fade/spring back to the full-body sprite when the existing post-release idle recovery timer returns Little Alex to standing.
5. Route visible sprite paths through presentation plus skin tone. Generate or derive missing tone variants so the visible full-body and ragdoll part sprites match face/body/limbs.

## Verification Surface

- Unit/component: `src/components/little-alex/little-alex-physics.test.tsx`
- App shell propagation: `src/components/app-shell/app-shell.test.tsx`
- Settings persistence: `src/components/settings/settings-panel.test.tsx`
- Asset contracts: `src/server/ai/little-alex-sprite-assets.test.ts`
- Browser/e2e visual QA: `e2e/little-alex-physics.spec.ts`
- Pixel QA helpers: `e2e/helpers/little-alex-pixel-qa.ts`

See the sibling docs for detailed lifecycle, asset, QA, and handoff guidance.
