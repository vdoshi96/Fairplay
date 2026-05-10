"use client";

import { useEffect, useState } from "react";

import type { PersonaSummary } from "@/contracts/personas";
import type { OnboardingPreferences } from "@/contracts/preferences";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseFlow } from "./crash-course-flow";

type CrashCoursePageClientProps = {
  selectedPersona: PersonaSummary;
};

export function CrashCoursePageClient({
  selectedPersona
}: CrashCoursePageClientProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [status, setStatus] = useState<"active" | "skipped" | "completed">(
    "active"
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const completionContextLabel = `${selectedPersona.displayName}'s Fairplay Theory`;

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
          setError("Unable to load Theory progress right now.");
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
    nextStep = currentStep,
    replayRequested = false
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
          crashCourseCompletedAt: nextStatus === "completed" ? now : null,
          ...(replayRequested ? { crashCourseReplayRequestedAt: now } : {})
        })
      });

      if (!response.ok) {
        throw new Error("save-preferences");
      }

      setCurrentStep(nextStep);
      setStatus(nextStatus);
    } catch {
      setError("Unable to save Theory progress right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="relative min-h-[100svh]">
      <div className="pointer-events-none fixed right-4 top-20 z-30 grid max-w-sm gap-2 sm:right-6 lg:top-6">
        {loading ? (
          <p
            className="pointer-events-auto rounded-[8px] border border-fp-line bg-[color:var(--fp-card)]/95 p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink shadow-[var(--fp-shadow-soft)] backdrop-blur"
            role="status"
          >
            Loading saved Theory progress...
          </p>
        ) : null}

        {error ? (
          <p
            className="pointer-events-auto rounded-[8px] border border-fp-danger/40 bg-[color:var(--fp-card)]/95 p-3 text-[14px] font-semibold leading-5 text-fp-danger shadow-[var(--fp-shadow-soft)] backdrop-blur"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {saving ? (
          <p
            className="pointer-events-auto rounded-[8px] border border-fp-line bg-[color:var(--fp-card)]/95 p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink shadow-[var(--fp-shadow-soft)] backdrop-blur"
            role="status"
          >
            Saving Theory progress...
          </p>
        ) : null}

        {status === "skipped" ? (
          <p
            className="pointer-events-auto rounded-[8px] border border-fp-line bg-[color:var(--fp-card)]/95 p-3 text-[14px] font-semibold leading-5 text-fp-muted-ink shadow-[var(--fp-shadow-soft)] backdrop-blur"
            role="status"
          >
            Course skipped for {selectedPersona.displayName}.
          </p>
        ) : null}
      </div>

      <CrashCourseFlow
        completed={status === "completed"}
        completionContextLabel={completionContextLabel}
        currentStep={currentStep}
        onProgress={(step) => {
          void updatePreferences("active", step);
        }}
        onSkip={() => void updatePreferences("skipped")}
        onComplete={() =>
          void updatePreferences("completed", CRASH_COURSE_LESSONS.length - 1)
        }
        onRestart={() => void updatePreferences("active", 0, true)}
      />
    </section>
  );
}
