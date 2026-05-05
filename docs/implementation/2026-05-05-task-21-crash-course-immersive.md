# Task 21: Crash Course Immersive Stage

## Expectations

- Convert the crash course from a compact card into a full-viewport lesson stage.
- Place large scene art behind and around a readable foreground lesson panel.
- Preserve accessible scene labels, including `Owner and helper learning scene` and `Household load learning scene`.
- Replace the repeated three-figure scene with distinct lesson compositions, poses, and props.
- Keep the minimum-standard rewrite interaction working.

## Outputs

- Added crash-course flow tests for the full-viewport stage, background scene layer, and foreground panel.
- Added scene tests for immersive size markers, preserved labels, owner/helper props, household hidden-load props, and unique composition markers for all ten scenes.
- Updated `CrashCourseFlow` to render a full `100svh` stage with an absolute background `CrashCourseScene` and a readable translucent foreground lesson panel.
- Updated the crash-course app route to remove the old page header and float saved-progress status messages above the illustrated stage.
- Added an immersive app-shell layout mode for `/app/crash-course` so the course is not constrained by the standard max-width content canvas.
- Rebuilt `CrashCourseScene` as a larger `960 x 640` SVG scene system with ten distinct compositions:
  - hidden household load
  - owner/helper grocery outcome
  - CPE path
  - minimum standards note
  - board lanes
  - active deck sorting
  - handoff context bridge
  - radar/check-in room
  - dynamic fairness scales
  - repair dialogue corner

## Verification

- Red run: `npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx`
  - Failed as expected for missing immersive scene markers, missing distinct composition markers, and missing `crash-course-stage`.
- Green run: `npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx`
  - Passed: 2 files, 18 tests.
- Lint: `npx eslint src/components/crash-course/crash-course-flow.tsx src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-scene.tsx src/components/crash-course/crash-course-scene.test.tsx`
  - Passed with no output.
- Controller route-shell verification: `npx vitest run src/components/crash-course/crash-course-scene.test.tsx src/components/crash-course/crash-course-flow.test.tsx src/components/app-shell/app-shell.test.tsx`
  - Passed: 3 files, 23 tests.
- Controller lint: `npx eslint src/app/app/crash-course/page.tsx src/components/app-shell/app-shell.tsx src/components/app-shell/app-shell.test.tsx src/components/crash-course/crash-course-flow.tsx src/components/crash-course/crash-course-flow.test.tsx src/components/crash-course/crash-course-scene.tsx src/components/crash-course/crash-course-scene.test.tsx`
  - Passed with no output.

## Challenges

- The first green attempt put the foreground stacking marker on the wrapper rather than the tested panel. I moved `z-10` onto the lesson panel and reran the focused tests successfully.
- I avoided touching page wrappers or other learning files because those are outside Worker A's owned file list.
