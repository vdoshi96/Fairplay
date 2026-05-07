import { forwardRef, type ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

type PageHeaderProps = {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  title: string;
};

type PageSurfaceProps = {
  children: ReactNode;
  className?: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const PageShell = forwardRef<HTMLElement, PageShellProps>(
  function PageShell({ children, className }, ref) {
    return (
      <section
        className={cn(
          "relative z-0 mx-auto grid w-full max-w-6xl gap-5 px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pr-44 lg:pt-8",
          className
        )}
        data-page-shell="foreground"
        data-testid="page-shell"
        ref={ref}
      >
        {children}
      </section>
    );
  }
);

export function PageHeader({
  actions,
  description,
  eyebrow,
  title
}: PageHeaderProps) {
  return (
    <header className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div className="grid gap-1">
        {eyebrow ? (
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[15px] leading-6 text-fp-muted-ink">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="justify-self-start sm:justify-self-end">{actions}</div>
      ) : null}
    </header>
  );
}

export function PageSurface({ children, className }: PageSurfaceProps) {
  return (
    <section
      className={cn(
        "rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-4 shadow-[var(--fp-shadow-soft)]",
        className
      )}
    >
      {children}
    </section>
  );
}
