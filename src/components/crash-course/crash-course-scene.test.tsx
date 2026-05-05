import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CrashCourseScene } from "./crash-course-scene";

describe("CrashCourseScene", () => {
  it("renders a balanced owner and helper scene", () => {
    render(<CrashCourseScene scene="owner-helper" />);

    expect(
      screen.getByRole("img", { name: "Owner and helper learning scene" })
    ).toBeVisible();
    expect(screen.getByTestId("scene-alex")).toBeVisible();
    expect(screen.getByTestId("scene-max")).toBeVisible();
    expect(screen.getByTestId("scene-helper")).toBeVisible();
  });

  it("renders CPE as three connected stages", () => {
    render(<CrashCourseScene scene="cpe-path" />);

    expect(screen.getByText("Conception")).toBeVisible();
    expect(screen.getByText("Planning")).toBeVisible();
    expect(screen.getByText("Execution")).toBeVisible();
  });
});
