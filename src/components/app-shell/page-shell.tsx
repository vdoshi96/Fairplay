import { forwardRef, type ReactNode } from "react";

import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

export type PageShellBackgroundId =
  | "askGreg"
  | "app"
  | "board"
  | "checkIns"
  | "distribute"
  | "library"
  | "settings"
  | "yourCards";

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
  askGreg: {
    id: "askGreg",
    src: "/assets/fairplay/generated-ui/backgrounds/library-shelf.png",
    testId: "page-shell-background-askGreg"
  },
  board: {
    id: "board",
    src: "/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png",
    testId: "page-shell-background-board"
  },
  checkIns: {
    id: "checkIns",
    src: "/assets/fairplay/generated-ui/backgrounds/check-in-table.png",
    testId: "page-shell-background-checkIns"
  },
  distribute: {
    id: "distribute",
    src: "/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png",
    testId: "page-shell-background-distribute"
  },
  library: {
    id: "library",
    src: "/assets/fairplay/generated-ui/backgrounds/library-shelf.png",
    testId: "page-shell-background-library"
  },
  settings: {
    id: "settings",
    src: "/assets/fairplay/generated-ui/backgrounds/settings-preferences.png",
    testId: "page-shell-background-settings"
  },
  yourCards: {
    id: "yourCards",
    src: "/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png",
    testId: "page-shell-background-yourCards"
  }
} satisfies Record<PageShellBackgroundId, PageShellBackground>;

export function pageShellBackgroundForPathname(pathname: string) {
  if (pathname.startsWith("/app/your-cards")) {
    return PAGE_SHELL_BACKGROUNDS.yourCards;
  }

  if (pathname.startsWith("/app/distribute")) {
    return PAGE_SHELL_BACKGROUNDS.distribute;
  }

  if (pathname.startsWith("/app/board") || pathname.startsWith("/app/load-map")) {
    return PAGE_SHELL_BACKGROUNDS.board;
  }

  if (pathname.startsWith("/app/ask-greg")) {
    return PAGE_SHELL_BACKGROUNDS.askGreg;
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

  return PAGE_SHELL_BACKGROUNDS.app;
}

export const PageShell = forwardRef<HTMLElement, PageShellProps>(
  function PageShell({ background, children, className }, ref) {
    return (
      <section
        className={cn(
          "relative z-0 grid min-h-[calc(100svh_-_var(--fp-app-bottom-nav-height))] w-full max-w-full overflow-x-clip px-4 pb-[var(--fp-app-content-bottom-padding)] pt-5 sm:px-6 lg:pt-8",
          className
        )}
        data-page-background-id={background?.id}
        data-page-shell="foreground"
        data-testid="page-shell"
        ref={ref}
      >
        {background ? (
          <DecorativeBackgroundLayer
            className="opacity-45 [background-position:center_top] [mask-image:linear-gradient(125deg,black_0%,rgba(0,0,0,0.62)_48%,rgba(0,0,0,0.18)_100%)]"
            src={background.src}
            testId={background.testId}
            washClassName="fp-page-background-wash"
          />
        ) : null}
        <div
          className="relative z-10 mx-auto grid w-full max-w-full min-w-0 gap-5 pr-[var(--fp-little-alex-inline-reserve)] lg:max-w-7xl lg:pl-8"
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
          <p className="text-[13px] font-bold text-fp-muted-ink">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-[30px] font-bold leading-[36px] text-fp-ink sm:text-[34px] sm:leading-[40px]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-[15px] font-medium leading-6 text-fp-muted-ink">
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
        "rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-crisp)]",
        className
      )}
    >
      {children}
    </section>
  );
}
