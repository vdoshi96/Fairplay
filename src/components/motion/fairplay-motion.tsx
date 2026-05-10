import type { ReactNode } from "react";

type PersonaKey = "alex" | "max";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function personaLabel(persona: PersonaKey) {
  return persona === "alex" ? "Alex" : "Max";
}

function personaColor(persona: PersonaKey) {
  return persona === "alex" ? "bg-fp-alex" : "bg-fp-max";
}

export function MotionPanel({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx("fp-motion-panel-enter", className)}>{children}</div>;
}

export function AssignmentShift({
  className,
  from,
  label = "Assignment shift",
  to
}: {
  className?: string;
  from: PersonaKey;
  label?: string;
  to: PersonaKey;
}) {
  return (
    <div
      aria-label={label}
      className={cx(
        "fp-motion-assignment-shift flex min-h-12 items-center gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-card)] px-3 py-2",
        className
      )}
      data-fp-motion="assignment-shift"
      role="img"
    >
      <span className="flex items-center gap-1 text-[12px] font-semibold text-fp-muted-ink">
        <span className={cx("h-2.5 w-2.5 rounded-full", personaColor(from))} />
        {personaLabel(from)}
      </span>
      <span
        aria-hidden="true"
        className="h-px w-8 rounded-full bg-fp-line after:block after:h-px after:w-4 after:origin-right after:translate-x-4 after:-rotate-45 after:bg-fp-line"
      />
      <span className="flex items-center gap-1 text-[12px] font-semibold text-fp-muted-ink">
        <span className={cx("h-2.5 w-2.5 rounded-full", personaColor(to))} />
        {personaLabel(to)}
      </span>
    </div>
  );
}

export function MotionSpark({
  className,
  decorative = false,
  label = "Gentle completion spark"
}: {
  className?: string;
  decorative?: boolean;
  label?: string;
}) {
  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      aria-label={decorative ? undefined : label}
      className={cx(
        "fp-motion-checkin-spark relative inline-block h-9 w-14 overflow-hidden rounded-[8px]",
        className
      )}
      data-testid="motion-spark"
      role={decorative ? undefined : "img"}
    >
      <span className="absolute left-2 top-5 h-2 w-2 rounded-full bg-fp-alex" />
      <span className="absolute left-6 top-2 h-2 w-2 rounded-full bg-fp-helper" />
      <span className="absolute right-3 top-4 h-2 w-2 rounded-full bg-fp-max" />
    </span>
  );
}
