import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CrashCourseSceneKey } from "./crash-course-content";
import { CrashCourseScene } from "./crash-course-scene";

describe("CrashCourseScene", () => {
  it("renders the owner and helper scene as immersive art with distinct outcome props", () => {
    render(<CrashCourseScene scene="owner-helper" />);

    const image = screen.getByRole("img", {
      name: "Owner and helper learning scene"
    });

    expect(image).toBeVisible();
    expect(image).toHaveAttribute("data-scene-scale", "immersive-background");
    expect(image).toHaveAttribute("data-scene-composition", "owner-helper-grocery-handoff");
    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/owner-helper.png"
    );
  });

  it("preserves the household load label while showing hidden work at background scale", () => {
    render(<CrashCourseScene scene="not-chore" />);

    const image = screen.getByRole("img", {
      name: "Household load learning scene"
    });

    expect(image).toBeVisible();
    expect(image).toHaveAttribute("data-scene-scale", "immersive-background");
    expect(image).toHaveAttribute("data-scene-composition", "hidden-load-home");
    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/not-chore.png"
    );
  });

  it("renders CPE as a generated background image", () => {
    render(<CrashCourseScene scene="cpe-path" />);

    expect(screen.getByTestId("crash-course-scene-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/cpe-path.png"
    );
  });

  it.each<[CrashCourseSceneKey, string]>([
    ["not-chore", "hidden-load-home"],
    ["owner-helper", "owner-helper-grocery-handoff"],
    ["cpe-path", "cpe-path-garden-map"],
    ["standards-note", "standards-note-workbench"],
    ["board-lanes", "board-lanes-room"],
    ["active-deck", "active-deck-sorting-table"],
    ["handoff", "handoff-context-bridge"],
    ["dynamic-fair", "dynamic-fair-capacity-scales"],
    ["repair", "repair-dialogue-corner"]
  ])("renders a distinct immersive composition for %s", (scene, composition) => {
    render(<CrashCourseScene scene={scene} />);

    expect(screen.getByRole("img")).toHaveAttribute(
      "data-scene-composition",
      composition
    );
  });
});
