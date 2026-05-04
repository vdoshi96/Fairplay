"use client";

import { useState } from "react";

import { CrashCourseFlow } from "@/components/crash-course/crash-course-flow";

export default function AppCrashCoursePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"active" | "skipped" | "completed">(
    "active"
  );

  return (
    <section className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
          Crash course
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Learn the household operating model
        </h1>
        <p className="text-[15px] leading-6 text-fp-muted-ink">
          A short, replayable guide to ownership, standards, handoffs, and
          check-ins before changing the board.
        </p>
      </div>

      {status !== "active" ? (
        <p
          className="rounded-[8px] border border-fp-line bg-white p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink"
          role="status"
        >
          {status === "completed"
            ? "Course marked complete for this browser session."
            : "Course skipped for this browser session."}
        </p>
      ) : null}

      <CrashCourseFlow
        currentStep={currentStep}
        onProgress={(step) => {
          setCurrentStep(step);
          setStatus("active");
        }}
        onSkip={() => setStatus("skipped")}
        onComplete={() => setStatus("completed")}
      />
    </section>
  );
}
