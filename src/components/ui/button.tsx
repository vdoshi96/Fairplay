import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    type = "button",
    variant = "secondary",
    ...props
  },
  ref
) {
  return (
    <button
      {...props}
      className={[
        "inline-flex min-h-11 min-w-0 max-w-full items-center justify-center gap-2 rounded-[8px] px-4 text-center text-[14px] font-bold whitespace-normal transition [overflow-wrap:anywhere] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary"
          ? "bg-fp-primary text-fp-on-primary shadow-[var(--fp-shadow-soft)] hover:bg-fp-primary-hover"
          : "",
        variant === "secondary"
          ? "border border-[var(--fp-line)] bg-[var(--fp-surface)] text-[var(--fp-ink)] shadow-[var(--fp-shadow-soft)] hover:bg-[var(--fp-surface-strong)]"
          : "",
        variant === "ghost"
          ? "text-[var(--fp-ink)] hover:bg-[var(--fp-surface-strong)]"
          : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      ref={ref}
      type={type}
    />
  );
});
