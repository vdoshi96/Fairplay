import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  type = "button",
  variant = "secondary",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded px-4 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary"
          ? "bg-[var(--fp-ink)] text-white shadow-[var(--fp-shadow-soft)] hover:bg-[var(--fp-ink-soft)]"
          : "",
        variant === "secondary"
          ? "border border-[var(--fp-line)] bg-[var(--fp-surface)] text-[var(--fp-ink)] hover:bg-[var(--fp-surface-strong)]"
          : "",
        variant === "ghost"
          ? "text-[var(--fp-ink)] hover:bg-[var(--fp-surface-strong)]"
          : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
    />
  );
}
