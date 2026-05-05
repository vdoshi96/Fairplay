import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  variant?: "ghost" | "solid";
};

export function IconButton({
  className,
  icon,
  type = "button",
  variant = "ghost",
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      className={[
        "inline-grid h-10 w-10 shrink-0 place-items-center rounded text-[var(--fp-ink)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55",
        variant === "solid"
          ? "border border-[var(--fp-line)] bg-[var(--fp-surface)] shadow-[var(--fp-shadow-soft)] hover:bg-[var(--fp-surface-strong)]"
          : "hover:bg-[var(--fp-surface-strong)]",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      type={type}
    >
      {icon}
    </button>
  );
}
