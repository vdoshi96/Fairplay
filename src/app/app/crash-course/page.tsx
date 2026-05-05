"use client";

import { useEffect, useState } from "react";

import { CrashCourseFlow } from "@/components/crash-course/crash-course-flow";
import { CRASH_COURSE_LESSONS } from "@/components/crash-course/crash-course-content";
import type { OnboardingPreferences } from "@/contracts/preferences";

export default function AppCrashCoursePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"active" | "skipped" | "completed">(
    "active"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPreferences() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/preferences/onboarding");

        if (!response.ok) {
          throw new Error("load-preferences");
        }

        const preferences = (await response.json()) as OnboardingPreferences;

        if (!mounted) {
          return;
        }

        setCurrentStep(preferences.crashCourseCurrentStep);
        if (preferences.crashCourseCompletedAt) {
          setStatus("completed");
        } else if (preferences.crashCourseSkippedAt) {
          setStatus("skipped");
        } else {
          setStatus("active");
        }
      } catch {
        if (mounted) {
          setError("Unable to load crash course progress right now.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  async function updatePreferences(
    nextStatus: "active" | "skipped" | "completed",
    nextStep = currentStep
  ) {
    const now = new Date().toISOString();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crashCourseCurrentStep: nextStep,
          crashCourseSkippedAt: nextStatus === "skipped" ? now : null,
          crashCourseCompletedAt: nextStatus === "completed" ? now : null
        })
      });

      if (!response.ok) {
        throw new Error("save-preferences");
      }

      setCurrentStep(nextStep);
      setStatus(nextStatus);
    } catch {
      setError("Unable to save crash course progress right now.");
    } finally {
      setSaving(false);
    }
  }

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

      {loading ? (
        <p
          className="rounded-[8px] border border-fp-line bg-white p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink"
          role="status"
        >
          Loading saved crash course progress...
        </p>
      ) : null}

      {error ? (
        <p
          className="rounded-[8px] border border-fp-danger/40 bg-white p-3 text-[14px] font-semibold leading-5 text-fp-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {saving ? (
        <p
          className="rounded-[8px] border border-fp-line bg-white p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink"
          role="status"
        >
          Saving crash course progress...
        </p>
      ) : null}

      {status !== "active" ? (
        <p
          className="rounded-[8px] border border-fp-line bg-white p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink"
          role="status"
        >
          {status === "completed"
            ? "Course marked complete for your active persona."
            : "Course skipped for your active persona."}
        </p>
      ) : null}

      <CrashCourseFlow
        currentStep={currentStep}
        onProgress={(step) => {
          void updatePreferences("active", step);
        }}
        onSkip={() => void updatePreferences("skipped")}
        onComplete={() =>
          void updatePreferences("completed", CRASH_COURSE_LESSONS.length - 1)
        }
      />
    </section>
  );
}
