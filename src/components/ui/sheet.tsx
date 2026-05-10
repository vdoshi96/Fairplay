import type { HTMLAttributes, ReactNode } from "react";

type SheetProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Sheet({ children, className, ...props }: SheetProps) {
  return (
    <section
      {...props}
      className={[
        "rounded-[8px] border border-[var(--fp-line)] bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-elevated)] sm:p-5",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
