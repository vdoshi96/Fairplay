/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

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
  completionContextLabel = "Fairplay Theory",
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
    () => `Frame ${step + 1} of ${CRASH_COURSE_LESSONS.length}`,
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
      className="relative isolate min-h-[100svh] overflow-hidden bg-fp-paper px-4 pb-32 pt-5 sm:px-6 sm:pb-10 lg:px-8 lg:pb-8 lg:pr-56"
      data-testid="crash-course-stage"
    >
      <DecorativeBackgroundLayer
        className="opacity-50 [background-position:center_top] [mask-image:linear-gradient(112deg,black_0%,rgba(0,0,0,0.82)_58%,rgba(0,0,0,0.38)_100%)]"
        src="/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png"
        testId="crash-course-background"
        washClassName="fp-page-background-wash"
      />
      <div
        className="relative z-10 mx-auto grid min-h-[calc(100svh_-_8rem)] w-full max-w-6xl content-start gap-4 py-3 sm:py-5"
        data-testid="crash-course-lesson-shell"
      >
        {completed ? (
          <div className="mx-auto grid w-full max-w-3xl gap-5 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-5 shadow-2xl backdrop-blur-md sm:p-7">
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
                  Theory complete
                </p>
                <h1
                  id="crash-course-title"
                  className="text-[30px] font-bold leading-[36px] text-fp-ink"
                >
                  Theory complete
                </h1>
              </div>
            </div>

            <div className="grid gap-2 text-[15px] leading-6 text-fp-muted-ink">
              <p>Finished for {completionContextLabel}.</p>
              <p>
                Core ideas covered: hidden work, ownership, CPE, done standards,
                handoffs, reviews, and repair.
              </p>
            </div>

            <FeaturePathList />

            {onRestart ? (
              <button
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25"
                onClick={onRestart}
                type="button"
              >
                Restart Theory
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <header
              className="grid gap-1 text-fp-ink"
              data-testid="crash-course-page-header"
            >
              <p className="text-[13px] font-semibold text-fp-muted-ink">
                Theory
              </p>
              <h1
                id="crash-course-title"
                className="max-w-3xl text-[30px] font-bold leading-[36px] sm:text-[34px] sm:leading-[40px]"
              >
                Concepts first. Tools after.
              </h1>
              <p className="max-w-2xl text-[15px] font-semibold leading-6 text-fp-muted-ink">
                Learn the model, then practice with one real responsibility.
              </p>
            </header>

            <div
              className="relative grid min-h-[calc(100svh_-_14rem)] w-full overflow-hidden rounded-[8px] border border-fp-line bg-[#edf4ee] shadow-2xl"
              data-testid="crash-course-storyboard-frame"
            >
              <CrashCourseScene
                className="min-h-[calc(100svh_-_14rem)]"
                scene={lesson.scene}
              />

              <div
                className="relative z-10 grid max-h-[72svh] gap-4 overflow-y-auto border-t border-white/70 bg-[var(--fp-surface-strong)] p-4 shadow-2xl backdrop-blur-md sm:p-5 lg:absolute lg:bottom-4 lg:left-4 lg:right-4 lg:max-h-[50svh] lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] lg:rounded-[8px] lg:border lg:border-fp-line"
                data-testid="crash-course-subtitle-panel"
              >
                <div className="grid gap-3">
                  <div className="grid gap-2">
                    <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
                      {progressLabel}
                    </p>
                    <h2
                      className="text-[26px] font-bold leading-[32px] text-fp-ink sm:text-[28px] sm:leading-[34px]"
                    >
                      {lesson.title}
                    </h2>
                    {lesson.exampleCardTitle ? (
                      <p className="text-[14px] font-semibold leading-5 text-fp-ink">
                        Example card: {lesson.exampleCardTitle}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
                      <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-fp-muted-ink">
                        Idea
                      </p>
                      <p className="text-[15px] leading-6 text-fp-muted-ink">
                        {lesson.concept}
                      </p>
                    </div>
                    <div className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-3">
                      <p className="text-[12px] font-bold uppercase tracking-[0.04em] text-fp-muted-ink">
                        Try
                      </p>
                      <p className="text-[15px] leading-6 text-fp-muted-ink">
                        {lesson.action}
                      </p>
                    </div>
                  </div>

                  {lesson.id === "done-standard" ? (
                    <div className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] p-4">
                      <label
                        htmlFor="minimum-standard-draft"
                        className="text-[14px] font-bold leading-5 text-fp-ink"
                      >
                        Write a done-well note in your own words
                      </label>
                      <textarea
                        id="minimum-standard-draft"
                        className="min-h-24 resize-y rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3 text-[15px] leading-6 text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
                        placeholder="Example: Lunches are packed before bedtime. Backup money is ready for rushed mornings."
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
                </div>

                <div className="grid content-end gap-3">
                  <StoryIndexTabs activeStep={step} onSelect={moveTo} />

                  <div className="grid gap-3 border-t border-fp-line pt-4">
                    <button
                      type="button"
                      className="min-h-11 rounded-[8px] border border-fp-line px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-45"
                      onClick={onSkip}
                    >
                      Skip Theory
                    </button>

                    <div className="grid grid-cols-2 gap-2">
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
                          Finish Theory
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
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function StoryIndexTabs({
  activeStep,
  onSelect
}: {
  activeStep: number;
  onSelect: (step: number) => void;
}) {
  return (
    <nav
      aria-label="Theory storyboard"
      className="flex gap-1 overflow-x-auto pb-1"
    >
      {CRASH_COURSE_LESSONS.map((lesson, index) => (
        <button
          aria-current={index === activeStep ? "step" : undefined}
          aria-label={`Go to lesson ${index + 1}: ${lesson.title}`}
          className={[
            "grid h-9 min-w-9 place-items-center rounded-[8px] border text-[12px] font-bold outline-none transition focus:ring-2 focus:ring-fp-ink/25",
            index === activeStep
              ? "border-fp-primary bg-fp-primary text-fp-on-primary"
              : "border-fp-line bg-[var(--fp-surface)] text-fp-muted-ink hover:bg-[var(--fp-surface-muted)] hover:text-fp-ink"
          ].join(" ")}
          key={lesson.id}
          onClick={() => onSelect(index)}
          type="button"
        >
          {String(index + 1).padStart(2, "0")}
        </button>
      ))}
    </nav>
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
