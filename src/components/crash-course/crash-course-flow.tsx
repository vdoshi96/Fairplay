/* eslint-disable @next/next/no-img-element */
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
  onRestart?: () => void;
  onSkip?: () => void;
  onComplete?: () => void;
};

function clampStep(step: number) {
  return Math.min(Math.max(step, 0), CRASH_COURSE_LESSONS.length - 1);
}

const recommendedFeaturePath =
  CRASH_COURSE_LESSONS[CRASH_COURSE_LESSONS.length - 1].featurePath ?? [];

export function CrashCourseFlow({
  completed = false,
  completionContextLabel = "the Fairplay crash course",
  currentStep = 0,
  onProgress,
  onRestart,
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
      className="relative isolate min-h-[100svh] overflow-hidden bg-fp-paper px-4 pb-32 pt-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-8 lg:pr-44"
      data-testid="crash-course-stage"
    >
      <CrashCourseScene
        className="pointer-events-none absolute inset-0 h-full min-h-[100svh] w-full"
        scene={lesson.scene}
      />

      <div
        className="relative z-10 mx-auto grid min-h-[calc(100svh_-_9rem)] w-full max-w-6xl items-center gap-4 py-3 sm:py-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)]"
        data-testid="crash-course-lesson-shell"
      >
        <div
          className="z-10 grid max-h-[calc(100svh_-_9rem)] w-full gap-5 overflow-y-auto rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-5 shadow-2xl backdrop-blur-md sm:p-7 lg:col-start-2"
          data-testid="crash-course-lesson-panel"
        >
          {completed ? (
            <>
              <div className="grid gap-4">
                <img
                  alt=""
                  aria-hidden="true"
                  className="h-28 w-28 rounded-[8px] object-contain shadow-[var(--fp-shadow-soft)]"
                  data-testid="crash-course-completion-celebration"
                  draggable={false}
                  height={768}
                  loading="eager"
                  src="/assets/fairplay/generated-ui/crash-course/completion-celebration.png"
                  width={768}
                />
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
                  You now know how Fairplay treats hidden load, ownership,
                  planning, standards, handoffs, check-ins, repair, and safety.
                </p>
                <p>
                  Next, follow the recommended learning path when you are ready
                  to turn those ideas into a visible household agreement.
                </p>
              </div>

              <FeaturePathList />

              {onRestart ? (
                <button
                  className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25"
                  onClick={onRestart}
                  type="button"
                >
                  Restart crash course
                </button>
              ) : null}
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

              {lesson.id === "done-well-enough" ? (
                <div className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-4">
                  <label
                    htmlFor="minimum-standard-draft"
                    className="text-[14px] font-bold leading-5 text-fp-ink"
                  >
                    Rewrite a household minimum standard in your own words
                  </label>
                  <textarea
                    id="minimum-standard-draft"
                    className="min-h-28 resize-y rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3 text-[15px] leading-6 text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
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

              {lesson.featurePath ? <FeaturePathList /> : null}

              <div className="grid gap-3 border-t border-fp-line pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <button
                  type="button"
                  className="min-h-11 rounded-[8px] border border-fp-line px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-45"
                  onClick={onSkip}
                >
                  Skip crash course
                </button>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    className="min-h-11 rounded-[8px] border border-fp-line px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isFirst}
                    onClick={() => moveTo(step - 1)}
                  >
                    Previous lesson
                  </button>
                  {isLast ? (
                    <button
                      type="button"
                      className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary outline-none transition hover:bg-fp-primary-hover focus:ring-2 focus:ring-fp-primary/25"
                      onClick={onComplete}
                    >
                      Finish course
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="min-h-11 rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary outline-none transition hover:bg-fp-primary-hover focus:ring-2 focus:ring-fp-primary/25"
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

function FeaturePathList() {
  return (
    <div className="grid gap-3 border-t border-fp-line pt-4">
      <h2 className="text-[16px] font-bold leading-6 text-fp-ink">
        Recommended learning path
      </h2>
      <div className="grid gap-2">
        {recommendedFeaturePath.map((item) => (
          <Link
            aria-label={item.label}
            className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3 text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25"
            href={item.href}
            key={item.href}
          >
            <span className="text-[14px] font-bold leading-5">{item.label}</span>
            <span className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
              {item.description}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
