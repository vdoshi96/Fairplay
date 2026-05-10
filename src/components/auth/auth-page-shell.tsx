import Link from "next/link";
import type { ReactNode } from "react";

type AuthPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  children: ReactNode;
  footer: ReactNode;
  visual?: ReactNode;
};

const AUTH_BACKGROUND =
  "/assets/fairplay/generated-ui/backgrounds/auth-warm-threshold.png";

export function AuthPageShell({
  children,
  eyebrow,
  footer,
  summary,
  title,
  visual
}: AuthPageShellProps) {
  const hasVisual = Boolean(visual);

  return (
    <main
      className="relative min-h-[100svh] overflow-hidden bg-fp-paper bg-cover bg-center px-4 py-6 text-fp-ink sm:px-6"
      data-auth-background
      style={{ backgroundImage: `url('${AUTH_BACKGROUND}')` }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--fp-page-gradient)] opacity-80 mix-blend-screen"
      />
      <section
        className={
          hasVisual
            ? "relative mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-6xl content-center gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)] lg:items-center"
            : "relative mx-auto grid min-h-[calc(100svh-3rem)] w-full max-w-md content-center gap-6"
        }
      >
        <div className="grid gap-6">
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-[8px] text-[15px] font-bold outline-none focus:ring-2 focus:ring-fp-ink/25"
            href="/"
          >
            <span
              aria-hidden="true"
              className="grid h-10 w-10 place-items-center rounded-[8px] border border-fp-line bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)]"
            >
              <span className="relative h-5 w-5 rounded-full border-2 border-fp-shared">
                <span className="absolute -left-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-fp-alex" />
                <span className="absolute -right-1.5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-fp-max" />
              </span>
            </span>
            Fairplay
          </Link>

          <div className="grid gap-2">
            <p className="text-[13px] font-bold uppercase tracking-[0.04em] text-fp-muted-ink">
              {eyebrow}
            </p>
            <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink">
              {title}
            </h1>
            <p className="text-[15px] font-medium leading-6 text-fp-muted-ink">{summary}</p>
          </div>

          <div className="fp-panel p-4 backdrop-blur-md sm:p-5">
            {children}
          </div>

          <div className="text-center text-[14px] leading-5 text-fp-muted-ink">
            {footer}
          </div>
        </div>

        {visual ? <div className="order-last">{visual}</div> : null}
      </section>
    </main>
  );
}
