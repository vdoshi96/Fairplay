"use client";

import { ArrowDown, MousePointerClick } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

type PracticeActionKind = "action" | "click";

type PracticeActionCalloutProps = {
  actionLabel: string;
  active?: boolean;
  className?: string;
  kind?: PracticeActionKind;
};

type PracticeActionGuidanceProps = PracticeActionCalloutProps & {
  children: ReactNode;
  wrapperClassName?: string;
};

export function PracticeActionCallout({
  actionLabel,
  active = true,
  className,
  kind = "click"
}: PracticeActionCalloutProps) {
  if (!active) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={[
        "inline-flex w-fit max-w-full items-center gap-2 rounded-[8px] border border-fp-helper/45 bg-[var(--fp-surface-strong)] px-2.5 py-1.5 text-[12px] font-bold leading-4 text-fp-ink shadow-[var(--fp-shadow-soft)]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      data-testid="practice-action-guidance"
    >
      <MousePointerClick aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span className="min-w-0 break-words">
        Next required {kind}: {actionLabel}.
      </span>
      <ArrowDown aria-hidden="true" className="h-4 w-4 shrink-0" />
    </p>
  );
}

export function PracticeActionGuidance({
  actionLabel,
  active = true,
  children,
  className,
  kind = "click",
  wrapperClassName
}: PracticeActionGuidanceProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      wrapperRef.current?.scrollIntoView?.({
        block: "center",
        inline: "nearest"
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [active, actionLabel]);

  return (
    <div
      className={["grid min-w-0 gap-1.5", wrapperClassName]
        .filter(Boolean)
        .join(" ")}
      ref={wrapperRef}
    >
      <PracticeActionCallout
        actionLabel={actionLabel}
        active={active}
        className={className}
        kind={kind}
      />
      {children}
    </div>
  );
}
