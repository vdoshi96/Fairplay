import { forwardRef, type ReactNode } from "react";

import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

export type PageShellBackgroundId =
  | "app"
  | "checkIns"
  | "home"
  | "library"
  | "loadMap"
  | "settings";

export type PageShellBackground = {
  id: PageShellBackgroundId;
  src: string;
  testId: string;
};

type PageShellProps = {
  background?: PageShellBackground;
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

export const PAGE_SHELL_BACKGROUNDS = {
  app: {
    id: "app",
    src: "/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png",
    testId: "page-shell-background-app"
  },
  checkIns: {
    id: "checkIns",
    src: "/assets/fairplay/generated-ui/backgrounds/check-in-table.png",
    testId: "page-shell-background-checkIns"
  },
  home: {
    id: "home",
    src: "/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png",
    testId: "page-shell-background-home"
  },
  library: {
    id: "library",
    src: "/assets/fairplay/generated-ui/backgrounds/library-shelf.png",
    testId: "page-shell-background-library"
  },
  loadMap: {
    id: "loadMap",
    src: "/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png",
    testId: "page-shell-background-loadMap"
  },
  settings: {
    id: "settings",
    src: "/assets/fairplay/generated-ui/backgrounds/settings-preferences.png",
    testId: "page-shell-background-settings"
  }
} satisfies Record<PageShellBackgroundId, PageShellBackground>;

export function pageShellBackgroundForPathname(pathname: string) {
  if (pathname === "/app/home") {
    return PAGE_SHELL_BACKGROUNDS.home;
  }

  if (pathname.startsWith("/app/library")) {
    return PAGE_SHELL_BACKGROUNDS.library;
  }

  if (pathname.startsWith("/app/check-ins")) {
    return PAGE_SHELL_BACKGROUNDS.checkIns;
  }

  if (pathname.startsWith("/app/settings")) {
    return PAGE_SHELL_BACKGROUNDS.settings;
  }

  if (pathname.startsWith("/app/load-map")) {
    return PAGE_SHELL_BACKGROUNDS.loadMap;
  }

  return PAGE_SHELL_BACKGROUNDS.app;
}

export const PageShell = forwardRef<HTMLElement, PageShellProps>(
  function PageShell({ background, children, className }, ref) {
    return (
      <section
        className={cn(
          "relative z-0 grid min-h-[calc(100svh_-_var(--fp-app-bottom-nav-height))] w-full px-4 pb-[var(--fp-app-content-bottom-padding)] pt-5 sm:px-6 lg:pt-8",
          className
        )}
        data-page-background-id={background?.id}
        data-page-shell="foreground"
        data-testid="page-shell"
        ref={ref}
      >
        {background ? (
          <DecorativeBackgroundLayer
            className="opacity-20 [background-position:center_top] [mask-image:linear-gradient(125deg,black_0%,rgba(0,0,0,0.52)_46%,rgba(0,0,0,0.12)_100%)]"
            src={background.src}
            testId={background.testId}
            washClassName="bg-white/70"
          />
        ) : null}
        <div
          className="relative z-10 mx-auto grid w-full max-w-6xl min-w-0 gap-5 pr-[var(--fp-little-alex-inline-reserve)] lg:pl-8"
          data-page-shell-content
        >
          {children}
        </div>
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
