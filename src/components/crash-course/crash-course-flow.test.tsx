import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseFlow } from "./crash-course-flow";

describe("crash course flow", () => {
  it("breaks the course into a storyboard of short source-safe frames", () => {
    expect(CRASH_COURSE_LESSONS.map((lesson) => lesson.title)).toEqual([
      "Start with hidden work",
      "Split doing from remembering",
      "Count the reset",
      "Keep only live responsibilities",
      "Helping is not owning",
      "Own the full path",
      "Define done well enough",
      "Leave room for autonomy",
      "Pass context with the handoff",
      "Use maps, not scoreboards",
      "Fair shifts with capacity",
      "Review while signals are small",
      "Repair misses plainly",
      "Try one real card"
    ]);
  });

  it("covers the report-derived learning concepts in practical original language", () => {
    const lessonText = CRASH_COURSE_LESSONS.map((lesson) =>
      [lesson.title, lesson.concept, lesson.action].join(" ")
    )
      .join(" ")
      .toLowerCase();
    const wordCount = lessonText.split(/\s+/).filter(Boolean).length;

    expect(CRASH_COURSE_LESSONS).toHaveLength(14);
    expect(wordCount).toBeGreaterThanOrEqual(500);
    expect(wordCount).toBeLessThanOrEqual(950);
    expect(lessonText).toContain("visible work");
    expect(lessonText).toContain("hidden work");
    expect(lessonText).toContain("owner");
    expect(lessonText).toContain("helper");
    expect(lessonText).toContain("cpe");
    expect(lessonText).toContain("done well enough");
    expect(lessonText).toContain("physical");
    expect(lessonText).toContain("cognitive");
    expect(lessonText).toContain("emotional");
    expect(lessonText).toContain("treadmill");
    expect(lessonText).toContain("finite");
    expect(lessonText).toContain("training");
    expect(lessonText).toContain("review");
    expect(lessonText).toContain("dynamic");
    expect(lessonText).toContain("appreciation");
    expect(lessonText).toContain("repair");
    expect(lessonText).toContain("unsafe");
    expect(lessonText).toContain("scoreboard");
    expect(lessonText).not.toContain("minimum standard of care");
    expect(lessonText).not.toContain("share meeting");
  });

  it("keeps each storyboard frame short enough to read like subtitles", () => {
    const sceneKeys = new Set(CRASH_COURSE_LESSONS.map((lesson) => lesson.scene));

    expect(sceneKeys.size).toBe(CRASH_COURSE_LESSONS.length);
    for (const lesson of CRASH_COURSE_LESSONS) {
      const wordCount = [lesson.concept, lesson.action]
        .join(" ")
        .split(/\s+/)
        .filter(Boolean).length;

      expect(wordCount).toBeGreaterThanOrEqual(25);
      expect(wordCount).toBeLessThanOrEqual(75);
      expect(lesson.action).toMatch(/[.!]$/);
    }
  });

  it("keeps feature-learning recommendations in the final section only", () => {
    const lessonsWithFeaturePath = CRASH_COURSE_LESSONS.filter(
      (lesson) => "featurePath" in lesson
    );
    const finalLesson = CRASH_COURSE_LESSONS.at(-1) as (typeof CRASH_COURSE_LESSONS)[number] & {
      featurePath?: Array<{ href: string; label: string }>;
    };

    expect(lessonsWithFeaturePath).toHaveLength(1);
    expect(finalLesson.featurePath?.map((item) => item.label)).toEqual([
      "Browse the Library",
      "Deal cards",
      "Schedule a Check-in"
    ]);
  });

  it("renders lessons inside a full-viewport immersive stage", () => {
    render(<CrashCourseFlow currentStep={1} />);

    const stage = screen.getByTestId("crash-course-stage");
    const shell = screen.getByTestId("crash-course-lesson-shell");
    const storyboardFrame = screen.getByTestId("crash-course-storyboard-frame");
    const subtitlePanel = screen.getByTestId("crash-course-subtitle-panel");
    const scene = screen.getByRole("img", {
      name: "Reminder and visible work storyboard scene"
    });

    expect(stage.className).toContain("min-h-[100svh]");
    expect(stage.className).toContain("overflow-hidden");
    expect(stage.className).toContain("relative");
    expect(stage.className).toContain("bg-fp-paper");
    expect(stage.className).toContain("pb-32");
    expect(stage.className).toContain("lg:pr-56");
    expect(shell.className).toContain("mx-auto");
    expect(shell.className).toContain("content-start");
    expect(screen.getByTestId("crash-course-background").className).toContain(
      "opacity-50"
    );
    expect(screen.getByRole("heading", { name: "Concepts first. Tools after." }))
      .toBeVisible();
    expect(
      screen.getByRole("button", {
        name: `Go to lesson 2: ${CRASH_COURSE_LESSONS[1]?.title}`
      })
    ).toHaveClass("h-11", "min-w-11");
    expect(storyboardFrame).toContainElement(scene);
    expect(storyboardFrame).toContainElement(subtitlePanel);
    expect(subtitlePanel.className).toContain("backdrop-blur-md");
    expect(subtitlePanel.className).toContain("lg:absolute");
    expect(screen.queryByTestId("crash-course-scene-anchor")).not.toBeInTheDocument();
    expect(scene).toHaveAttribute("data-scene-scale", "immersive-background");
  });

  it("moves through lessons and records progress callbacks", () => {
    const onProgress = vi.fn();
    render(<CrashCourseFlow currentStep={4} onProgress={onProgress} />);

    expect(
      screen.getByRole("img", { name: "Owner and helper learning scene" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Next lesson" }));
    expect(onProgress).toHaveBeenLastCalledWith(5);

    fireEvent.click(screen.getByRole("button", { name: "Previous lesson" }));
    expect(onProgress).toHaveBeenLastCalledWith(4);
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

    fireEvent.click(screen.getByRole("button", { name: "Skip Theory" }));
    fireEvent.click(screen.getByRole("button", { name: "Finish Theory" }));

    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("shows a celebration splash after the course has been completed", () => {
    render(
      <CrashCourseFlow
        completed
        completionContextLabel="Alex's Fairplay Theory"
        currentStep={CRASH_COURSE_LESSONS.length - 1}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: "Theory complete"
      })
    ).toBeVisible();
    expect(screen.getByText("Finished for Alex's Fairplay Theory."))
      .toBeVisible();
    expect(
      screen.getByText(
        "Core ideas covered: hidden work, ownership, CPE, done standards, handoffs, reviews, and repair."
      )
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "Recommended learning path" }))
      .toBeVisible();
    expect(screen.getByRole("link", { name: "Browse the Library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(screen.getByTestId("crash-course-completion-celebration")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/crash-course/completion-celebration.png"
    );
    expect(
      screen.getByRole("link", { name: "Deal cards" })
    ).toHaveAttribute("href", "/app/distribute");
    expect(
      screen.queryByRole("button", { name: "Finish Theory" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip Theory" })
    ).not.toBeInTheDocument();
  });

  it("lets completed users restart the course from the completion splash", () => {
    const onRestart = vi.fn();
    render(
      <CrashCourseFlow
        completed
        completionContextLabel="Alex's Fairplay Theory"
        currentStep={CRASH_COURSE_LESSONS.length - 1}
        onRestart={onRestart}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Restart Theory" }));

    expect(onRestart).toHaveBeenCalledTimes(1);
  });

  it("includes an interactive standard rewrite prompt in the standards lesson", () => {
    render(<CrashCourseFlow currentStep={6} />);

    const prompt = screen.getByLabelText(
      "Write a done-well note in your own words"
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
