# Work Log: Generated UI Assets

## 2026-05-05

### Setup

- Created isolated worktree `/Users/vishal/Developer/Fairplay/.worktrees/generated-ui-assets`.
- Branch: `codex/generated-ui-assets`.
- Confirmed root `main` and `origin/main` matched at `24ddcc5ccd9e974a03be35d4082e71a5e70114b0` before branching.

### Superpowers

- Used `using-git-worktrees` for branch isolation.
- Used `brainstorming` to frame scope and design.
- Used `writing-plans` to record implementation tasks.
- Used `subagent-driven-development` by dispatching independent read-only inventory, generation, and QA subagents.
- Used `test-driven-development` for code changes.

### Subagents

#### Visual Inventory Subagent

Found the main non-card surfaces:

- Shared visual wrapper: avatars, mascot, radar visual, app mark, check-in spark.
- Login splash CSS illustration.
- Ten crash-course SVG scenes.
- Five feature-guide helper CSS scenelets.
- AI task manager sidekick.
- App shell/auth/persona chooser consumers of shared visuals.

Recommended stable paths under `public/assets/fairplay/generated-ui/`, excluding `public/assets/fairplay/cards/**`.

#### Prompt/Generation Subagent

Recommended a separate non-card UI generator because `scripts/generate-visible-assets.mjs` is source-card-specific and enforces `5:7`.

Proposed cute flat 2D prompts for:

- Login household garden.
- Alex and Max abstract sidekick avatars.
- Helper mascot.
- Crash-course backgrounds.
- Onboarding/home/load-map/radar/library/check-in scenes.

#### QA Subagent

Recommended tests for:

- New PNG paths and decorative alt behavior.
- Asset integrity and dimensions.
- Login/crash-course/guide helper public contracts instead of internal SVG/CSS implementation details.
- Browser checks for login, crash course, onboarding, home, load map, radar, and check-ins.

### Decisions

- Use `public/assets/fairplay/generated-ui/` instead of `public/assets/fairplay/ui/` to make generated asset provenance explicit.
- Generate PNGs with Qwen production env.
- Keep generated art decorative where possible and retain existing accessible labels in DOM.

### Implementation

- Added `src/server/ai/generated-ui-assets.ts` as the central asset spec and prompt builder for 24 non-card UI assets.
- Added `scripts/generate-ui-assets.mjs` as a Qwen-only generator guarded to `qwen-image-2.0-pro`.
- Added generator options for `--dry-run`, `--slugs`, `--limit`, `--output-dir`, `--skip-existing`, retry/backoff, and existing-file resume.
- Generated 24 PNGs under `public/assets/fairplay/generated-ui/` and refreshed `generation-manifest.json` with repo-relative paths.
- Added asset integrity tests that verify generated PNG existence, file size, and expected dimensions.
- Replaced non-card SVG/CSS drawings in shared visuals, login splash, crash-course scenes, crash-course completion splash, guide helper thumbnails, and the library AI task manager sidekick.
- Left `public/assets/fairplay/cards/**` untouched.

### QA Follow-Up

- Reused the QA subagent for a final read-only audit after local wiring.
- Fixed the subagent's real P2 finding by wiring `crash-course/completion-celebration.png` into the completed crash-course splash.
- Kept the visible `greg - the taskmaster` and `hi im little alex horne` labels because those were explicit product-copy requirements from the user; the generated image itself remains stylized and original.
- Retained old public non-card SVG files as inert legacy assets because runtime and E2E references now point at generated PNGs; removing them can be a separate cleanup PR if desired.

### Verification

- `npm run assets:generate-ui -- --skip-existing`: passed; skipped provider setup because every generated asset already existed.
- `npm run test -- src/server/ai/generated-ui-assets.test.ts src/server/ai/generated-ui-asset-files.test.ts`: passed.
- `npm run test -- src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-page-client.test.tsx src/components/crash-course/crash-course-scene.test.tsx`: passed.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run test`: passed, 90 files and 433 tests.
- `npm run build`: passed. Next.js warns about nested worktree lockfile root inference.
- `npm run test:e2e`: passed, 11 Playwright tests.
