# Task 15: Crash Course Character Scenes

## Expectations

- Add a scene key to every crash course lesson.
- Render original, friendly cartoon-style crash course scenes with balanced Alex, Max, and helper figures.
- Include gentle home or nature motifs without copying any card or source artwork.
- Expose an accessible owner/helper scene image named `Owner and helper learning scene`.
- Show the CPE path stages as `Conception`, `Planning`, and `Execution`.
- Place the scene beside the lesson intro on desktop and above course content on mobile without disrupting text or controls.

## Outputs

- Created `CrashCourseScene` as a reusable SVG illustration component for all crash course scene keys.
- Added typed scene keys to `CRASH_COURSE_LESSONS`.
- Updated `CrashCourseFlow` so each active lesson renders its scene in the intro area with responsive ordering.
- Added scene-specific tests and a flow integration assertion.

## Verification

- Initial focused Vitest run failed as expected because `crash-course-scene.tsx` did not exist and the flow did not render the owner/helper image.
- Final focused Vitest run passed:

```bash
npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx
```

Result: 2 test files passed, 6 tests passed.

## Challenges

- Local `node_modules` was incomplete, so the first test attempt could not load `vitest/config`.
- `npm install` initially failed on a stale `node_modules/next` directory. Removing the corrupted generated Next install directory and rerunning `npm install` restored the local test environment.
