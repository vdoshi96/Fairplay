"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CRASH_COURSE_LESSONS } from "./crash-course-content";
import { CrashCourseScene } from "./crash-course-scene";

type CrashCourseFlowProps = {
  completed?: boolean;
  completionContextLabel?: string;
  currentStep?: number;
  onProgress?: (step: number) => void;
  onSkip?: () => void;
  onComplete?: () => void;
};

function clampStep(step: number) {
  return Math.min(Math.max(step, 0), CRASH_COURSE_LESSONS.length - 1);
}

export function CrashCourseFlow({
  completed = false,
  completionContextLabel = "the Fairplay crash course",
  currentStep = 0,
  onProgress,
  onSkip,
  onComplete
}: CrashCourseFlowProps) {
  const [step, setStep] = useState(() => clampStep(currentStep));
  const [standardDraft, setStandardDraft] = useState("");

  useEffect(() => {
    setStep(clampStep(currentStep));
  }, [currentStep]);

  const lesson = CRASH_COURSE_LESSONS[step];
  const isFirst = step === 0;
  const isLast = step === CRASH_COURSE_LESSONS.length - 1;
  const progressLabel = useMemo(
    () => `Lesson ${step + 1} of ${CRASH_COURSE_LESSONS.length}`,
    [step]
  );

  function moveTo(nextStep: number) {
    const clampedStep = clampStep(nextStep);
    setStep(clampedStep);
    onProgress?.(clampedStep);
  }

  return (
    <section
      aria-labelledby="crash-course-title"
      className="relative isolate min-h-[100svh] overflow-hidden bg-[#edf4ee] px-4 py-6 sm:px-6 lg:px-8"
      data-testid="crash-course-stage"
    >
      <CrashCourseScene
        className="pointer-events-none absolute inset-0 h-full min-h-[100svh] w-full"
        scene={lesson.scene}
      />

      <div className="relative z-10 flex min-h-[calc(100svh_-_3rem)] items-center py-4 sm:py-8">
        <div
          className="z-10 grid w-full max-w-2xl gap-5 rounded-[8px] border border-white/80 bg-white/[0.92] p-5 shadow-2xl backdrop-blur-md sm:p-7"
          data-testid="crash-course-lesson-panel"
        >
          {completed ? (
            <>
              <div className="grid gap-4">
                <div
                  aria-hidden="true"
                  className="relative h-24 w-24 overflow-hidden rounded-full border border-fp-line bg-[#fff8df] shadow-[var(--fp-shadow-soft)]"
                >
                  <div className="absolute left-1/2 top-5 h-12 w-12 -translate-x-1/2 rounded-full bg-[#f7c75f]" />
                  <div className="absolute left-[31px] top-[29px] h-3 w-3 rounded-full bg-fp-ink" />
                  <div className="absolute right-[31px] top-[29px] h-3 w-3 rounded-full bg-fp-ink" />
                  <div className="absolute left-[35px] top-[45px] h-3 w-7 rounded-b-full border-b-[5px] border-fp-ink" />
                  <div className="absolute bottom-0 left-3 h-10 w-6 -rotate-12 rounded-t-[8px] bg-[#c26f59]" />
                  <div className="absolute bottom-0 right-3 h-10 w-6 rotate-12 rounded-t-[8px] bg-[#506fa8]" />
                  <div className="absolute left-3 top-3 h-3 w-3 rounded-full bg-[#2f7d6e]" />
                  <div className="absolute right-4 top-4 h-2 w-7 rotate-12 rounded-full bg-[#c26f59]" />
                  <div className="absolute bottom-4 left-5 h-2 w-7 -rotate-12 rounded-full bg-[#506fa8]" />
                </div>
                <div className="grid gap-2">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
                    Course complete
                  </p>
                  <h1
                    id="crash-course-title"
                    className="text-[30px] font-bold leading-[36px] text-fp-ink"
                  >
                    Hooray! Congrats on finishing {completionContextLabel}.
                  </h1>
                </div>
              </div>

              <div className="grid gap-3 text-[15px] leading-6 text-fp-muted-ink">
                <p>
                  You now know how Fairplay treats ownership, planning,
                  standards, handoffs, radar, and repair.
                </p>
                <p>
                  Next, use the Load Map to turn those ideas into a visible
                  household agreement.
                </p>
              </div>

              <div className="flex border-t border-fp-line pt-4">
                <Link
                  className="inline-flex min-h-11 items-center rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white outline-none transition hover:bg-fp-ink/90 focus:ring-2 focus:ring-fp-ink/25"
                  href="/app/load-map"
                >
                  Open the Load Map
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-2">
                <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
                  {progressLabel}
                </p>
                <h1
                  id="crash-course-title"
                  className="text-[28px] font-bold leading-[34px] text-fp-ink"
                >
                  {lesson.title}
                </h1>
                {lesson.exampleCardTitle ? (
                  <p className="text-[14px] font-semibold leading-5 text-fp-ink">
                    Example card: {lesson.exampleCardTitle}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-3 text-[15px] leading-6 text-fp-muted-ink">
                <p>{lesson.concept}</p>
                <p>{lesson.action}</p>
              </div>

              {lesson.id === "minimum-standards" ? (
                <div className="grid gap-2 rounded-[8px] border border-fp-line bg-fp-soft p-4">
                  <label
                    htmlFor="minimum-standard-draft"
                    className="text-[14px] font-bold leading-5 text-fp-ink"
                  >
                    Rewrite a household minimum standard in your own words
                  </label>
                  <textarea
                    id="minimum-standard-draft"
                    className="min-h-28 resize-y rounded-[8px] border border-fp-line bg-white p-3 text-[15px] leading-6 text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
                    placeholder="Example: Lunches are packed before bedtime, and backup lunch money is ready for rushed mornings."
                    value={standardDraft}
                    onChange={(event) => setStandardDraft(event.target.value)}
                  />
                  {standardDraft.trim().length > 0 ? (
                    <p className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
                      Saved as a local draft for this practice step.
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-3 border-t border-fp-line pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <button
                  type="button"
                  className="min-h-11 rounded-[8px] border border-fp-line px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={onSkip}
                >
                  Skip crash course
                </button>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    className="min-h-11 rounded-[8px] border border-fp-line px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isFirst}
                    onClick={() => moveTo(step - 1)}
                  >
                    Previous lesson
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white outline-none transition hover:bg-fp-ink/90 focus:ring-2 focus:ring-fp-ink/25"
                      onClick={onComplete}
                    >
                      Finish course
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="min-h-11 rounded-[8px] bg-fp-ink px-4 text-[14px] font-bold text-white outline-none transition hover:bg-fp-ink/90 focus:ring-2 focus:ring-fp-ink/25"
                      onClick={() => moveTo(step + 1)}
                    >
                      Next lesson
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
