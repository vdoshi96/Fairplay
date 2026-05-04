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

  it("moves through lessons and records progress callbacks", () => {
    const onProgress = vi.fn();
    render(<CrashCourseFlow currentStep={1} onProgress={onProgress} />);

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
