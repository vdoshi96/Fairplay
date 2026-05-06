# Little Alex Pixel QA

## Scope

- Added strict image-recognition QA for Little Alex rendered screenshots.
- Kept the work isolated from sprite generation and rig layout changes.
- Used `sharp` to inspect actual PNG pixels instead of relying on wrapper element rectangles.

## Why This Exists

The prior QA could pass when body-part wrappers were close enough even if the visible art still looked disjointed. The new recognizer captures two frames:

- the normal rendered screenshot;
- the same screenshot with `[data-testid="little-alex-horne"]` hidden.

The difference between those frames is the actual rendered Little Alex silhouette. That mask is then checked for visible connectedness, large pixel gaps, and duplicate clipboard-colored regions.

## Checks

- Foreground detection: fail if Little Alex cannot be found in the visible-vs-hidden screenshot diff.
- Near-connected silhouette: dilate the foreground mask by `8px`; after that, the visible character must collapse to one major component.
- Large part gaps: major raw foreground components must be within `14px` of another major component.
- Clipboard count: the torso-band tan pixel components must resolve to exactly one clipboard-like cluster.

## TDD Evidence

- Red 1: `npm run test:e2e -- little-alex-pixel-qa.spec.ts` failed because the helper module did not exist.
- Red 2: the helper stub returned `[]`, so the detached/duplicate synthetic fixture failed to report the required issues.
- Green: `npm run test:e2e -- little-alex-pixel-qa.spec.ts` passed with one coherent fixture and one intentionally broken fixture.

## QA Evidence

- `npm run test:e2e -- little-alex-pixel-qa.spec.ts`: passed, 2 tests.
- `npm run test:e2e -- little-alex-physics.spec.ts --grep "captures visual QA"`: passed with pixel checks enabled for neutral, masculine, and feminine screenshots.
- `npm run test:e2e -- little-alex-physics.spec.ts`: passed, 9 tests.
- `npm run typecheck`: passed.
- `npm run lint -- e2e/little-alex-physics.spec.ts e2e/little-alex-pixel-qa.spec.ts e2e/helpers/little-alex-pixel-qa.ts`: passed.

## Notes

- A concurrent Playwright run briefly failed with `EADDRINUSE` on port `3101`; rerunning the visual screenshot spec by itself passed.
- The first pixel run over-counted a lower-leg/background tan edge as a clipboard. The detector now limits clipboard candidates to the torso band while the synthetic duplicate-clipboard fixture remains covered.
