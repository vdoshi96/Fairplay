import type { HTMLAttributes } from "react";

type ChipTone =
  | "caregiving"
  | "daily"
  | "default"
  | "happiness"
  | "home"
  | "kid-split"
  | "kids"
  | "magic"
  | "out"
  | "wild";

type ChipProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: ChipTone;
};

const toneClasses: Record<ChipTone, string> = {
  caregiving: "border-[color:var(--fp-caregiving)]/25 bg-[color:var(--fp-caregiving)]/10 text-[var(--fp-caregiving)]",
  daily: "border-[color:var(--fp-daily)]/25 bg-[color:var(--fp-daily)]/10 text-[var(--fp-daily)]",
  default: "border-[var(--fp-line)] bg-[var(--fp-surface)] text-[var(--fp-muted)]",
  happiness: "border-[color:var(--fp-happiness)]/25 bg-[color:var(--fp-happiness)]/10 text-[var(--fp-happiness)]",
  home: "border-[color:var(--fp-home)]/25 bg-[color:var(--fp-home)]/10 text-[var(--fp-home)]",
  "kid-split": "border-[color:var(--fp-kid-split)]/25 bg-[color:var(--fp-kid-split)]/10 text-[var(--fp-kid-split)]",
  kids: "border-[color:var(--fp-kids)]/25 bg-[color:var(--fp-kids)]/10 text-[var(--fp-kids)]",
  magic: "border-[color:var(--fp-magic)]/25 bg-[color:var(--fp-magic)]/10 text-[var(--fp-magic)]",
  out: "border-[color:var(--fp-out)]/25 bg-[color:var(--fp-out)]/10 text-[var(--fp-out)]",
  wild: "border-[color:var(--fp-wild)]/25 bg-[color:var(--fp-wild)]/10 text-[var(--fp-wild)]"
};

export function Chip({ className, tone = "default", ...props }: ChipProps) {
  return (
    <span
      {...props}
      className={[
        "inline-flex max-w-full items-center truncate rounded border px-2 py-1 text-xs font-bold leading-none",
        toneClasses[tone],
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
