"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  GUIDE_PRACTICE_COMPLETE_EVENT,
  requestGuidePractice,
  resetGuidePractice
} from "./guide-practice";
import type { GuideStep } from "./guide-content";

export type { GuideStep } from "./guide-content";

type GuidedTourProps = {
  featureName: string;
  onExit: () => void;
  steps: GuideStep[];
};

type HighlightBox = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type DialogPlacement = {
  left: number | string;
  maxHeight: number | string;
  top: number | string;
  width: number | string;
};

type NumericDialogPlacement = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

const highlightPadding = 8;
const dialogViewportMargin = 16;
const dialogTargetGap = 12;
const maxDialogWidth = 480;
const fallbackDialogHeight = 280;

export function GuidedTour({ featureName, onExit, steps }: GuidedTourProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<HighlightBox | null>(null);
  const [dialogPlacement, setDialogPlacement] = useState<DialogPlacement>(
    getInitialDialogPlacement
  );
  const [completedPracticeEventIds, setCompletedPracticeEventIds] = useState<
    Set<string>
  >(() => new Set());
  const [startedPracticeEventIds, setStartedPracticeEventIds] = useState<
    Set<string>
  >(() => new Set());
  const dialogRef = useRef<HTMLDivElement>(null);
  const activeStep = steps[Math.min(activeIndex, Math.max(steps.length - 1, 0))];
  const isLastStep = activeIndex >= steps.length - 1;
  const requiredPracticeEventIds = useMemo(
    () =>
      activeStep?.practice
        ? activeStep.practice.requiredEventIds ?? [activeStep.practice.eventId]
        : [],
    [activeStep]
  );
  const completedPracticeCount = requiredPracticeEventIds.filter((eventId) =>
    completedPracticeEventIds.has(eventId)
  ).length;
  const hasPractice = Boolean(activeStep?.practice);
  const practiceComplete =
    !hasPractice ||
    requiredPracticeEventIds.every((eventId) =>
      completedPracticeEventIds.has(eventId)
    );
  const practiceStarted = activeStep?.practice
    ? startedPracticeEventIds.has(activeStep.practice.eventId)
    : false;
  const allowsRequiredPracticeInteraction = Boolean(
    activeStep?.practice?.requiredEventIds?.length &&
      practiceStarted &&
      !practiceComplete
  );
  const [practiceSurfaceBox, setPracticeSurfaceBox] =
    useState<HighlightBox | null>(null);
  const guidePracticeEventIds = useMemo(
    () =>
      Array.from(
        new Set(
          steps
            .map((step) => step.practice?.eventId)
            .filter((eventId): eventId is string => Boolean(eventId))
        )
      ),
    [steps]
  );
  const guidePracticeEventIdsRef = useRef(guidePracticeEventIds);
  const exitGuide = useCallback(() => {
    guidePracticeEventIds.forEach((eventId) => resetGuidePractice(eventId));
    onExit();
  }, [guidePracticeEventIds, onExit]);

  useEffect(() => {
    guidePracticeEventIdsRef.current = guidePracticeEventIds;
  }, [guidePracticeEventIds]);

  useEffect(
    () => () => {
      guidePracticeEventIdsRef.current.forEach((eventId) =>
        resetGuidePractice(eventId)
      );
    },
    []
  );

  useLayoutEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        exitGuide();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exitGuide]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [activeIndex]);

  useEffect(() => {
    if (!activeStep?.practice) {
      return;
    }

    function handlePracticeComplete(event: Event) {
      const detail = (event as CustomEvent<{ eventId?: string }>).detail;

      const eventId = detail?.eventId;

      if (eventId && requiredPracticeEventIds.includes(eventId)) {
        setCompletedPracticeEventIds((current) => {
          const next = new Set(current);
          next.add(eventId);
          return next;
        });
      }
    }

    window.addEventListener(GUIDE_PRACTICE_COMPLETE_EVENT, handlePracticeComplete);

    return () => {
      window.removeEventListener(
        GUIDE_PRACTICE_COMPLETE_EVENT,
        handlePracticeComplete
      );
    };
  }, [activeStep, requiredPracticeEventIds]);

  useEffect(() => {
    function updateHighlight({ scroll }: { scroll: boolean }) {
      if (!activeStep) {
        setHighlightBox(null);
        return;
      }

      const selector = `[data-guide-id="${CSS.escape(activeStep.targetId)}"]`;
      const target = document.querySelector<HTMLElement>(selector);

      if (!target) {
        setHighlightBox(null);
        return;
      }

      if (scroll) {
        target.scrollIntoView?.({ block: "center", inline: "nearest" });
      }
      const rect = target.getBoundingClientRect();
      if (!targetIsVisible(rect)) {
        setHighlightBox(null);
        return;
      }

      setHighlightBox({
        height: rect.height + highlightPadding * 2,
        left: rect.left - highlightPadding,
        top: rect.top - highlightPadding,
        width: rect.width + highlightPadding * 2
      });
    }

    updateHighlight({ scroll: true });
    const remeasureHighlight = () => updateHighlight({ scroll: false });
    window.addEventListener("resize", remeasureHighlight);
    window.addEventListener("scroll", remeasureHighlight, true);

    return () => {
      window.removeEventListener("resize", remeasureHighlight);
      window.removeEventListener("scroll", remeasureHighlight, true);
    };
  }, [activeStep]);

  useEffect(() => {
    function updateDialogPlacement() {
      setDialogPlacement(
        getDialogPlacement({
          dialogElement: dialogRef.current,
          highlightBox
        })
      );
    }

    updateDialogPlacement();
    window.addEventListener("resize", updateDialogPlacement);
    window.addEventListener("scroll", updateDialogPlacement, true);

    return () => {
      window.removeEventListener("resize", updateDialogPlacement);
      window.removeEventListener("scroll", updateDialogPlacement, true);
    };
  }, [activeIndex, activeStep, highlightBox]);

  useEffect(() => {
    if (!allowsRequiredPracticeInteraction) {
      setPracticeSurfaceBox(null);
      return;
    }

    function updatePracticeSurfaceBox() {
      const surface = document.querySelector<HTMLElement>(
        "[data-guide-practice-surface]"
      );

      if (!surface) {
        setPracticeSurfaceBox(null);
        return;
      }

      const rect = surface.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const left = Math.max(0, Math.min(rect.left, viewportWidth));
      const top = Math.max(0, Math.min(rect.top, viewportHeight));
      const right = Math.max(left, Math.min(rect.right, viewportWidth));
      const bottom = Math.max(top, Math.min(rect.bottom, viewportHeight));

      if (right <= left || bottom <= top) {
        setPracticeSurfaceBox(null);
        return;
      }

      setPracticeSurfaceBox({
        height: bottom - top,
        left,
        top,
        width: right - left
      });
    }

    updatePracticeSurfaceBox();
    window.addEventListener("resize", updatePracticeSurfaceBox);
    window.addEventListener("scroll", updatePracticeSurfaceBox, true);

    return () => {
      window.removeEventListener("resize", updatePracticeSurfaceBox);
      window.removeEventListener("scroll", updatePracticeSurfaceBox, true);
    };
  }, [allowsRequiredPracticeInteraction]);

  if (!activeStep) {
    return null;
  }

  const backdropBlockerClass = "fixed z-40 cursor-default bg-black/55";
  const stopBackdropClick = (event: ReactMouseEvent<HTMLButtonElement>) =>
    event.stopPropagation();

  return (
    <>
      {practiceSurfaceBox ? (
        <>
          <button
            aria-label="Guided tour backdrop"
            className={backdropBlockerClass}
            data-testid="guide-backdrop-blocker"
            onClick={stopBackdropClick}
            style={{
              height: practiceSurfaceBox.top,
              left: 0,
              top: 0,
              width: "100dvw"
            }}
            type="button"
          />
          <button
            aria-hidden="true"
            className={backdropBlockerClass}
            data-testid="guide-backdrop-blocker"
            onClick={stopBackdropClick}
            style={{
              height: `calc(100dvh - ${
                practiceSurfaceBox.top + practiceSurfaceBox.height
              }px)`,
              left: 0,
              top: practiceSurfaceBox.top + practiceSurfaceBox.height,
              width: "100dvw"
            }}
            tabIndex={-1}
            type="button"
          />
          <button
            aria-hidden="true"
            className={backdropBlockerClass}
            data-testid="guide-backdrop-blocker"
            onClick={stopBackdropClick}
            style={{
              height: practiceSurfaceBox.height,
              left: 0,
              top: practiceSurfaceBox.top,
              width: practiceSurfaceBox.left
            }}
            tabIndex={-1}
            type="button"
          />
          <button
            aria-hidden="true"
            className={backdropBlockerClass}
            data-testid="guide-backdrop-blocker"
            onClick={stopBackdropClick}
            style={{
              height: practiceSurfaceBox.height,
              left: practiceSurfaceBox.left + practiceSurfaceBox.width,
              top: practiceSurfaceBox.top,
              width: `calc(100dvw - ${
                practiceSurfaceBox.left + practiceSurfaceBox.width
              }px)`
            }}
            tabIndex={-1}
            type="button"
          />
        </>
      ) : (
        <button
          aria-label="Guided tour backdrop"
          className="fixed inset-0 z-40 cursor-default bg-black/55"
          onClick={stopBackdropClick}
          type="button"
        />
      )}

      {highlightBox ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 rounded-[8px] border-2 border-fp-helper bg-[var(--fp-surface)]/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
          data-testid="guide-highlight"
          style={{
            height: highlightBox.height,
            left: highlightBox.left,
            top: highlightBox.top,
            width: highlightBox.width
          }}
        />
      ) : null}

      <section
        aria-label={`${featureName} guide`}
        aria-modal="true"
        className="pointer-events-auto fixed z-[70] grid grid-rows-[minmax(0,1fr)_auto] gap-4 overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-5 text-fp-ink shadow-[var(--fp-shadow-elevated)] outline-none"
        ref={dialogRef}
        role="dialog"
        style={{
          left: dialogPlacement.left,
          maxHeight: dialogPlacement.maxHeight,
          top: dialogPlacement.top,
          width: dialogPlacement.width
        }}
        tabIndex={-1}
      >
        <div
          aria-label={`${activeStep.title} guide text`}
          className="grid min-h-0 gap-2 overflow-y-auto pr-1"
          data-testid="guide-dialog-body"
          tabIndex={0}
        >
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <h2 className="text-[22px] font-bold leading-7">{activeStep.title}</h2>
          <p className="text-[15px] leading-6 text-fp-muted-ink">{activeStep.body}</p>
          {activeStep.practice ? (
            <div className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] px-3 py-3 text-[14px] leading-5 text-fp-muted-ink">
              <p>{activeStep.practice.prompt}</p>
              <button
                className="min-h-10 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 text-[13px] font-bold text-fp-ink outline-none transition hover:bg-[var(--fp-surface-muted)] focus:ring-2 focus:ring-fp-ink/25 disabled:opacity-60"
                disabled={practiceComplete}
                onClick={() => {
                  const practiceEventId = activeStep.practice?.eventId ?? "";
                  setStartedPracticeEventIds((current) => {
                    const next = new Set(current);
                    next.add(practiceEventId);
                    return next;
                  });
                  requestGuidePractice(practiceEventId);
                }}
                type="button"
              >
                {activeStep.practice.actionLabel}
              </button>
              {practiceComplete ? (
                <p className="font-semibold text-fp-ink">
                  {activeStep.practice.completionMessage}
                </p>
              ) : requiredPracticeEventIds.length > 1 ? (
                <p className="font-semibold text-fp-muted-ink">
                  Practice progress: {completedPracticeCount} of{" "}
                  {requiredPracticeEventIds.length}
                </p>
              ) : null}
            </div>
          ) : null}
          {!highlightBox ? (
            <p className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-muted)] px-3 py-2 text-[14px] leading-5 text-fp-muted-ink">
              This part of the page is not visible right now.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={exitGuide} variant="ghost">
            Skip
          </Button>
          <div className="flex items-center gap-2">
            <Button
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
            >
              Back
            </Button>
            <Button
              disabled={!practiceComplete}
              onClick={() => {
                if (isLastStep) {
                  exitGuide();
                  return;
                }

                setActiveIndex((index) => Math.min(index + 1, steps.length - 1));
              }}
              variant="primary"
            >
              {isLastStep ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function targetIsVisible(rect: DOMRect): boolean {
  if (rect.width <= 0 || rect.height <= 0) {
    return false;
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < viewportWidth &&
    rect.top < viewportHeight
  );
}

function getInitialDialogPlacement(): DialogPlacement {
  return {
    left: dialogViewportMargin,
    maxHeight: `calc(100dvh - ${dialogViewportMargin * 2}px)`,
    top: dialogViewportMargin,
    width: `min(calc(100dvw - ${dialogViewportMargin * 2}px), ${maxDialogWidth}px)`
  };
}

function getDialogPlacement({
  dialogElement,
  highlightBox
}: {
  dialogElement: HTMLDivElement | null;
  highlightBox: HighlightBox | null;
}): DialogPlacement {
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const margin = Math.min(
    dialogViewportMargin,
    Math.max(0, Math.floor(Math.min(viewportWidth, viewportHeight) / 2))
  );
  const availableWidth = Math.max(0, viewportWidth - margin * 2);
  const width = Math.min(maxDialogWidth, availableWidth);
  const measuredRect = dialogElement?.getBoundingClientRect();
  const measuredHeight =
    measuredRect && measuredRect.height > 0
      ? measuredRect.height
      : fallbackDialogHeight;
  const height = Math.min(measuredHeight, Math.max(0, viewportHeight - margin * 2));
  const fallbackLeft = viewportWidth - margin - width;
  const fallbackTop = viewportHeight - margin - height;

  if (!highlightBox) {
    const top = clamp(
      fallbackTop,
      margin,
      Math.max(margin, viewportHeight - margin)
    );
    return {
      left: clamp(
        fallbackLeft,
        margin,
        Math.max(margin, viewportWidth - margin - width)
      ),
      maxHeight: Math.max(0, viewportHeight - top - margin),
      top,
      width
    };
  }

  const highlightRight = highlightBox.left + highlightBox.width;
  const highlightBottom = highlightBox.top + highlightBox.height;
  const highlightCenterX = highlightBox.left + highlightBox.width / 2;
  const highlightCenterY = highlightBox.top + highlightBox.height / 2;
  const maxLeft = Math.max(margin, viewportWidth - margin - width);
  const maxTop = Math.max(margin, viewportHeight - margin - height);
  const candidates = [
    {
      left: highlightCenterX - width / 2,
      top: highlightBottom + dialogTargetGap
    },
    {
      left: highlightCenterX - width / 2,
      top: highlightBox.top - dialogTargetGap - height
    },
    {
      left: highlightBox.left - dialogTargetGap - width,
      top: highlightCenterY - height / 2
    },
    {
      left: highlightRight + dialogTargetGap,
      top: highlightCenterY - height / 2
    },
    {
      left: fallbackLeft,
      top: fallbackTop
    }
  ].map((candidate) => {
    const top = clamp(candidate.top, margin, maxTop);
    return {
      left: clamp(candidate.left, margin, maxLeft),
      maxHeight: Math.max(0, viewportHeight - top - margin),
      top,
      width
    };
  });

  return candidates.reduce((best, candidate) => {
    const bestScore = scorePlacement(best, highlightBox, height);
    const candidateScore = scorePlacement(candidate, highlightBox, height);
    return candidateScore > bestScore ? candidate : best;
  });
}

function scorePlacement(
  placement: NumericDialogPlacement,
  highlightBox: HighlightBox,
  dialogHeight: number
): number {
  const placementRight = placement.left + placement.width;
  const placementBottom =
    placement.top + Math.min(dialogHeight, placement.maxHeight);
  const highlightRight = highlightBox.left + highlightBox.width;
  const highlightBottom = highlightBox.top + highlightBox.height;
  const overlapWidth = Math.max(
    0,
    Math.min(placementRight, highlightRight) -
      Math.max(placement.left, highlightBox.left)
  );
  const overlapHeight = Math.max(
    0,
    Math.min(placementBottom, highlightBottom) -
      Math.max(placement.top, highlightBox.top)
  );
  const overlapArea = overlapWidth * overlapHeight;
  const visibleHeight = Math.min(dialogHeight, placement.maxHeight);

  return visibleHeight - overlapArea * 4;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
