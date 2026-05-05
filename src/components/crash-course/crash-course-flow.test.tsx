import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseFlow } from "./crash-course-flow";

describe("crash course flow", () => {
  it("contains the ten approved course lessons", () => {
    expect(CRASH_COURSE_LESSONS.map((lesson) => lesson.title)).toEqual([
      "Why this is not a chore app",
      "Owner vs. helper",
      "CPE: Conception, Planning, Execution",
      "Minimum standards and done well enough",
      "The board lanes",
      "Build your active deck",
      "Handoffs and re-deals",
      "Radar and check-ins",
      "Fair is dynamic",
      "Repair and resistance"
    ]);
  });

  it("renders lessons inside a full-viewport immersive stage", () => {
    render(<CrashCourseFlow currentStep={1} />);

    const stage = screen.getByTestId("crash-course-stage");
    const panel = screen.getByTestId("crash-course-lesson-panel");
    const scene = screen.getByRole("img", {
      name: "Owner and helper learning scene"
    });

    expect(stage.className).toContain("min-h-[100svh]");
    expect(stage.className).toContain("overflow-hidden");
    expect(stage.className).toContain("relative");
    expect(panel.className).toContain("z-10");
    expect(panel.className).toContain("bg-white/");
    expect(scene).toHaveAttribute("data-scene-scale", "immersive-background");
    expect(scene.className).toContain("absolute");
    expect(scene.className).toContain("inset-0");
  });

  it("moves through lessons and records progress callbacks", () => {
    const onProgress = vi.fn();
    render(<CrashCourseFlow currentStep={1} onProgress={onProgress} />);

    expect(
      screen.getByRole("img", { name: "Owner and helper learning scene" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
    expect(onProgress).toHaveBeenLastCalledWith(2);

    fireEvent.click(screen.getByRole("button", { name: "Previous lesson" }));
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it("skips and finishes through explicit callbacks", () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();
    render(
      <CrashCourseFlow
        currentStep={CRASH_COURSE_LESSONS.length - 1}
        onComplete={onComplete}
        onSkip={onSkip}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip crash course" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish course" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows a celebration splash after the course has been completed", () => {
    render(
      <CrashCourseFlow
        completed
        completionContextLabel="Alex's Fairplay crash course"
        currentStep={CRASH_COURSE_LESSONS.length - 1}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Hooray! Congrats on finishing Alex's Fairplay crash course."
      })
    ).toBeVisible();
    expect(
      screen.getByText(
        "You now know how Fairplay treats ownership, planning, standards, handoffs, radar, and repair."
      )
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open the Load Map" })
    ).toHaveAttribute("href", "/app/load-map");
    expect(
      screen.queryByRole("button", { name: "Finish course" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip crash course" })
    ).not.toBeInTheDocument();
  });

  it("includes an interactive standard rewrite prompt in lesson 4", () => {
    render(<CrashCourseFlow currentStep={3} />);

    const prompt = screen.getByLabelText(
      "Rewrite a household minimum standard in your own words"
    );
    fireEvent.change(prompt, {
      target: {
        value: "Lunches are packed before bedtime with one flexible backup option."
      }
    });

    expect(prompt).toHaveValue(
      "Lunches are packed before bedtime with one flexible backup option."
    );
    expect(
      screen.getByText("Saved as a local draft for this practice step.")
    ).toBeVisible();
  });
});
