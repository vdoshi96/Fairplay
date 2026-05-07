import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CrashCourseSceneKey } from "./crash-course-content";
import { CrashCourseScene } from "./crash-course-scene";

describe("CrashCourseScene", () => {
  it("renders the owner and helper scene as immersive art with distinct outcome props", () => {
    render(<CrashCourseScene scene="helper-owner" />);

    const image = screen.getByRole("img", {
      name: "Owner and helper learning scene"
    });

    expect(image).toBeVisible();
    expect(image).toHaveAttribute("data-scene-scale", "immersive-background");
    expect(image).toHaveAttribute("data-scene-composition", "helper-owner-grocery-table");
    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/helper-owner.png"
    );
  });

  it("preserves the household load label while showing hidden work at background scale", () => {
    render(<CrashCourseScene scene="hidden-load-entry" />);

    const image = screen.getByRole("img", {
      name: "Household load learning scene"
    });

    expect(image).toBeVisible();
    expect(image).toHaveAttribute("data-scene-scale", "immersive-background");
    expect(image).toHaveAttribute("data-scene-composition", "hidden-load-entryway");
    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/hidden-load-entry.png"
    );
  });

  it("renders CPE as a generated background image", () => {
    render(<CrashCourseScene scene="cpe-outcome" />);

    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/cpe-outcome.png"
    );
  });

  it.each<[CrashCourseSceneKey, string]>([
    ["hidden-load-entry" as CrashCourseSceneKey, "hidden-load-entryway"],
    ["visible-reminder" as CrashCourseSceneKey, "visible-reminder-counter"],
    ["treadmill-reset" as CrashCourseSceneKey, "treadmill-reset-loop"],
    ["active-set" as CrashCourseSceneKey, "active-set-sorting"],
    ["helper-owner" as CrashCourseSceneKey, "helper-owner-grocery-table"],
    ["cpe-outcome" as CrashCourseSceneKey, "cpe-outcome-path"],
    ["done-standard" as CrashCourseSceneKey, "done-standard-note"],
    ["standard-autonomy" as CrashCourseSceneKey, "standard-autonomy-workbench"],
    ["handoff-context" as CrashCourseSceneKey, "handoff-context-bridge"],
    ["load-map" as CrashCourseSceneKey, "load-map-room"],
    ["capacity-shift" as CrashCourseSceneKey, "capacity-shift-scale"],
    ["check-in-signal" as CrashCourseSceneKey, "check-in-signal-table"],
    ["repair-loop" as CrashCourseSceneKey, "repair-loop-corner"],
    ["next-move" as CrashCourseSceneKey, "next-move-path"]
  ])("renders a distinct immersive composition for %s", (scene, composition) => {
    render(<CrashCourseScene scene={scene} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "data-scene-composition",
      composition
    );
  });
});
