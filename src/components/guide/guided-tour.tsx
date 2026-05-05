"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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

const highlightPadding = 8;

export function GuidedTour({ featureName, onExit, steps }: GuidedTourProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [highlightBox, setHighlightBox] = useState<HighlightBox | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const activeStep = steps[Math.min(activeIndex, Math.max(steps.length - 1, 0))];
  const isLastStep = activeIndex >= steps.length - 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onExit();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onExit]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, [activeIndex]);

  useEffect(() => {
    function updateHighlight() {
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

      const rect = target.getBoundingClientRect();
      setHighlightBox({
        height: rect.height + highlightPadding * 2,
        left: rect.left - highlightPadding,
        top: rect.top - highlightPadding,
        width: rect.width + highlightPadding * 2
      });
    }

    updateHighlight();
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);

    return () => {
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [activeStep]);

  if (!activeStep) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Guided tour backdrop"
        className="absolute inset-0 cursor-default bg-black/55"
        onClick={(event) => event.stopPropagation()}
        type="button"
      />

      {highlightBox ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-[8px] border-2 border-fp-helper bg-white/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.18)]"
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
        className="absolute bottom-5 left-1/2 grid w-[min(92vw,28rem)] -translate-x-1/2 gap-4 rounded-[8px] border border-fp-line bg-white p-5 text-fp-ink shadow-[var(--fp-shadow-elevated)] outline-none sm:bottom-8 sm:right-8 sm:left-auto sm:translate-x-0"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
            Step {activeIndex + 1} of {steps.length}
          </p>
          <h2 className="text-[22px] font-bold leading-7">{activeStep.title}</h2>
          <p className="text-[15px] leading-6 text-fp-muted-ink">{activeStep.body}</p>
          {!highlightBox ? (
            <p className="rounded-[8px] border border-fp-line bg-fp-surface px-3 py-2 text-[14px] leading-5 text-fp-muted-ink">
              This part of the page is not visible right now.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button onClick={onExit} variant="ghost">
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
              onClick={() => {
                if (isLastStep) {
                  onExit();
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
    </div>
  );
}
