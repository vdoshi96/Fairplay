"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarCheck,
  CreditCard,
  Layers3,
  Library,
  MessageCircle,
  MoreHorizontal,
  Send,
  Settings,
} from "lucide-react";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import type { LittleAlexPreferences } from "@/contracts/preferences";
import { LittleAlexPhysics } from "@/components/little-alex/little-alex-physics";
import { FairplayMark, PersonaAvatar } from "@/components/visuals/fairplay-visuals";
import { PageShell, pageShellBackgroundForPathname } from "./page-shell";

type AppShellProps = {
  children: ReactNode;
  household: HouseholdSummary;
  littleAlexPreferences: LittleAlexPreferences;
  selectedPersona: PersonaSummary;
};

const primaryNavItems = [
  { href: "/app/your-cards", icon: CreditCard, label: "Your Deck" },
  { href: "/app/distribute", icon: Send, label: "Deal" },
  { href: "/app/board", icon: Layers3, label: "Board" },
  { href: "/app/ask-greg", icon: MessageCircle, label: "Ask Greg" }
] as const;

const overflowNavItems = [
  { href: "/app/check-ins", icon: CalendarCheck, label: "Check-in" },
  { href: "/app/crash-course", icon: BookOpen, label: "Theory" },
  { href: "/app/settings", icon: Settings, label: "Settings" },
  { href: "/app/library", icon: Library, label: "Card Library" }
] as const;

const LITTLE_ALEX_DESKTOP_MEDIA =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine)";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/app/your-cards") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  household,
  littleAlexPreferences,
  selectedPersona
}: AppShellProps) {
  const pathname = usePathname();
  const isImmersiveRoute = pathname === "/app/crash-course";
  const pageBackground = isImmersiveRoute
    ? undefined
    : pageShellBackgroundForPathname(pathname);
  const mainClassName = isImmersiveRoute
    ? "w-full pb-24 lg:pb-0"
    : "w-full";
  const showLittleAlex = useDesktopLittleAlex();

  return (
    <div
      className="min-h-[100svh] w-full max-w-full overflow-x-clip bg-fp-paper text-fp-ink lg:grid lg:grid-cols-[var(--fp-app-sidebar-width)_minmax(0,1fr)]"
      data-testid="app-shell-root"
    >
      {showLittleAlex ? (
        <LittleAlexPhysics
          chatPhrase={littleAlexPreferences.chatPhrase}
          genderPresentation={littleAlexPreferences.genderPresentation}
          hairColor={littleAlexPreferences.hairColor}
          skinTone={littleAlexPreferences.skinTone}
        />
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[var(--fp-app-sidebar-width)] border-r border-fp-line bg-[var(--fp-surface-strong)] px-4 py-5 shadow-[var(--fp-shadow-soft)] backdrop-blur lg:flex lg:flex-col">
        <Link
          className="flex min-w-0 items-center gap-3 rounded outline-none focus:ring-2 focus:ring-fp-ink/25"
          href="/app/your-cards"
        >
          <FairplayMark
            className="h-11 w-11 shrink-0 rounded border border-fp-line bg-white"
            decorative
          />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-bold leading-5">
              {household.name}
            </span>
            <span className="block text-[12px] font-semibold text-fp-muted-ink">
              Fairplay
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="mt-8 grid gap-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-11 items-center gap-3 rounded px-3 text-[14px] font-semibold outline-none transition focus:ring-2 focus:ring-fp-ink/20",
                  isActive
                    ? "bg-fp-primary text-fp-on-primary shadow-[var(--fp-shadow-soft)]"
                    : "text-fp-muted-ink hover:bg-[var(--fp-surface)] hover:text-fp-ink"
                ].join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <nav aria-label="More" className="mt-6 grid gap-1 border-t border-fp-line pt-4">
          {overflowNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(pathname, item.href);

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex min-h-10 items-center gap-3 rounded px-3 text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-fp-ink/20",
                  isActive
                    ? "bg-[var(--fp-surface)] text-fp-ink"
                    : "text-fp-muted-ink hover:bg-[var(--fp-surface)] hover:text-fp-ink"
                ].join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon aria-hidden className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex min-h-12 items-center gap-3 rounded border border-fp-line bg-[var(--fp-surface)] px-3 text-[13px] font-semibold">
          <PersonaAvatar
            className="fp-motion-persona-bob h-8 w-8 shrink-0 rounded-full"
            decorative
            persona={selectedPersona.key === "max" ? "max" : "alex"}
          />
          <span className="truncate">{selectedPersona.displayName}</span>
        </div>
      </aside>

      <div className="min-w-0 max-w-full overflow-x-clip lg:col-start-2">
        <header
          className="sticky top-0 z-10 w-full max-w-full overflow-x-clip border-b border-fp-line bg-[var(--fp-surface-strong)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:hidden"
          data-testid="mobile-app-header"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <Link
              className="flex min-w-0 items-center gap-3 rounded outline-none focus:ring-2 focus:ring-fp-ink/25"
              href="/app/your-cards"
            >
              <FairplayMark
                className="h-10 w-10 shrink-0 rounded border border-fp-line bg-white"
                decorative
              />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-5">
                  {household.name}
                </span>
                <span className="block text-[12px] font-semibold text-fp-muted-ink">
                  {selectedPersona.displayName}
                </span>
              </span>
            </Link>
          </div>
        </header>

        <main
          className={mainClassName}
          data-layout={isImmersiveRoute ? "immersive" : "standard"}
          data-testid="app-main"
        >
          {isImmersiveRoute ? (
            children
          ) : (
            <PageShell background={pageBackground}>{children}</PageShell>
          )}
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-10 min-h-[var(--fp-app-bottom-nav-height)] w-full max-w-full overflow-visible border-t border-fp-line bg-[var(--fp-surface-strong)] px-2 pb-[max(0.5rem,var(--fp-app-safe-area-bottom))] pt-2 shadow-[0_-10px_30px_rgba(32,33,36,0.08)] lg:hidden"
          data-testid="mobile-bottom-navigation"
        >
          <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "grid min-h-12 min-w-0 place-items-center gap-1 rounded px-1 text-center text-[11px] font-semibold leading-4 outline-none transition focus:ring-2 focus:ring-fp-ink/20",
                    isActive
                      ? "bg-fp-primary text-fp-on-primary"
                      : "text-fp-muted-ink hover:bg-[var(--fp-surface)] hover:text-fp-ink"
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
            <OverflowMenu pathname={pathname} placement="bottom" />
          </div>
        </nav>
      </div>
    </div>
  );
}

function useDesktopLittleAlex() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      setEnabled(false);
      return undefined;
    }

    const media = window.matchMedia(LITTLE_ALEX_DESKTOP_MEDIA);
    const update = () => setEnabled(media.matches);

    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);

      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);

    return () => media.removeListener(update);
  }, []);

  return enabled;
}

function OverflowMenu({
  pathname,
  placement = "desktop"
}: {
  pathname: string;
  placement?: "bottom" | "desktop";
}) {
  const isBottomPlacement = placement === "bottom";
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      setIsOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="fp-overflow-menu relative min-w-0 shrink-0">
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-label="Open more actions"
        className={[
          "grid cursor-pointer list-none place-items-center rounded border border-fp-line bg-white text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25 [&::-webkit-details-marker]:hidden",
          isBottomPlacement
            ? "min-h-12 w-full gap-1 px-1 text-[11px] font-semibold leading-4 text-fp-muted-ink hover:bg-[var(--fp-surface)] hover:text-fp-ink"
            : "h-11 w-11"
        ].join(" ")}
        onClick={() => setIsOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <MoreHorizontal aria-hidden className="h-5 w-5" />
        {isBottomPlacement ? <span className="truncate">More</span> : null}
      </button>

      {isOpen ? (
        <>
          {isBottomPlacement ? (
            <button
              aria-label="Close more actions"
              className="fixed inset-0 z-20 cursor-default bg-transparent"
              data-testid="mobile-more-menu-dismiss-layer"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsOpen(false);
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              type="button"
            />
          ) : null}
          <nav
            aria-label="More"
            className={[
              "fp-overflow-menu-panel z-30 grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-2 shadow-[var(--fp-shadow-elevated)]",
              isBottomPlacement
                ? "fixed inset-x-3 bottom-[calc(var(--fp-app-bottom-nav-height)+var(--fp-app-safe-area-bottom)+0.75rem)] mx-auto max-w-sm origin-bottom"
                : "absolute right-0 top-12 min-w-48"
            ].join(" ")}
            data-testid={isBottomPlacement ? "mobile-bottom-more-menu" : undefined}
            id={menuId}
          >
            {overflowNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-11 items-center gap-3 rounded-[8px] px-3 text-[14px] font-bold outline-none transition focus:ring-2 focus:ring-fp-ink/20",
                    isActive
                      ? "bg-fp-primary text-fp-on-primary"
                      : "text-fp-ink hover:bg-[var(--fp-surface)]"
                  ].join(" ")}
                  href={item.href}
                  key={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </>
      ) : null}
    </div>
  );
}
