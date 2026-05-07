import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseFlow } from "./crash-course-flow";

describe("crash course flow", () => {
  it("contains five tight source-safe conceptual sections", () => {
    expect(CRASH_COURSE_LESSONS.map((lesson) => lesson.title)).toEqual([
      "See the hidden load",
      "Own the outcome",
      "Define done well enough",
      "Move work with the context",
      "Keep a repair loop"
    ]);
  });

  it("covers the report-derived learning concepts in practical original language", () => {
    const lessonText = CRASH_COURSE_LESSONS.map((lesson) =>
      [lesson.title, lesson.concept, lesson.action].join(" ")
    )
      .join(" ")
      .toLowerCase();
    const wordCount = lessonText.split(/\s+/).filter(Boolean).length;

    expect(wordCount).toBeGreaterThanOrEqual(650);
    expect(wordCount).toBeLessThanOrEqual(1200);
    expect(lessonText).toContain("visible work");
    expect(lessonText).toContain("hidden work");
    expect(lessonText).toContain("owner");
    expect(lessonText).toContain("helper");
    expect(lessonText).toContain("cpe");
    expect(lessonText).toContain("good enough");
    expect(lessonText).toContain("physical");
    expect(lessonText).toContain("cognitive");
    expect(lessonText).toContain("emotional");
    expect(lessonText).toContain("treadmill");
    expect(lessonText).toContain("finite");
    expect(lessonText).toContain("training");
    expect(lessonText).toContain("radar");
    expect(lessonText).toContain("check-in");
    expect(lessonText).toContain("dynamic");
    expect(lessonText).toContain("appreciation");
    expect(lessonText).toContain("repair");
    expect(lessonText).toContain("deferral");
    expect(lessonText).toContain("safety");
    expect(lessonText).not.toContain("minimum standard of care");
    expect(lessonText).not.toContain("share meeting");
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
      "Open the Load Map",
      "Add a Radar item",
      "Run a Check-in"
    ]);
  });

  it("renders lessons inside a full-viewport immersive stage", () => {
    render(<CrashCourseFlow currentStep={1} />);

    const stage = screen.getByTestId("crash-course-stage");
    const shell = screen.getByTestId("crash-course-lesson-shell");
    const panel = screen.getByTestId("crash-course-lesson-panel");
    const scene = screen.getByRole("img", {
      name: "Owner and helper learning scene"
    });

    expect(stage.className).toContain("min-h-[100svh]");
    expect(stage.className).toContain("overflow-hidden");
    expect(stage.className).toContain("relative");
    expect(stage.className).toContain("bg-fp-paper");
    expect(stage.className).toContain("pb-32");
    expect(stage.className).toContain("lg:pr-44");
    expect(shell.className).toContain("mx-auto");
    expect(shell.className).toContain("lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]");
    expect(shell.className).toContain("items-center");
    expect(screen.queryByTestId("crash-course-scene-anchor")).not.toBeInTheDocument();
    expect(panel.className).toContain("max-h-[calc(100svh_-_9rem)]");
    expect(panel.className).toContain("z-10");
    expect(panel.className).toContain("bg-[var(--fp-surface-strong)]");
    expect(panel.className).not.toContain("bg-white/");
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
        "You now know how Fairplay treats hidden load, ownership, planning, standards, handoffs, radar, check-ins, repair, and safety."
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
      screen.getByRole("link", { name: "Open the Load Map" })
    ).toHaveAttribute("href", "/app/load-map");
    expect(
      screen.queryByRole("button", { name: "Finish course" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip crash course" })
    ).not.toBeInTheDocument();
  });

  it("includes an interactive standard rewrite prompt in the standards lesson", () => {
    render(<CrashCourseFlow currentStep={2} />);

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
