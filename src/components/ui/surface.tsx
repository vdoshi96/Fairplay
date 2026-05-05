import type { HTMLAttributes, ReactNode } from "react";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: "default" | "strong" | "subtle";
};

export function Surface({
  children,
  className,
  tone = "default",
  ...props
}: SurfaceProps) {
  return (
    <div
      {...props}
      className={[
        "rounded border border-[var(--fp-line)]",
        tone === "default" ? "bg-[var(--fp-surface)] shadow-[var(--fp-shadow-soft)]" : "",
        tone === "strong"
          ? "bg-[var(--fp-surface-strong)] shadow-[var(--fp-shadow-elevated)]"
          : "",
        tone === "subtle" ? "bg-[var(--fp-surface-muted)]" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
