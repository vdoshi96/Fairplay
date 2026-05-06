"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  CalendarCheck,
  Home,
  LayoutDashboard,
  Library,
  Radar,
  Settings,
  Sparkles
} from "lucide-react";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import type { LittleAlexPreferences } from "@/contracts/preferences";
import { LittleAlexPhysics } from "@/components/little-alex/little-alex-physics";
import { FairplayMark, PersonaAvatar } from "@/components/visuals/fairplay-visuals";

type AppShellProps = {
  children: ReactNode;
  household: HouseholdSummary;
  littleAlexPreferences: LittleAlexPreferences;
  selectedPersona: PersonaSummary;
};

const navItems = [
  { href: "/app/home", icon: Home, label: "Home" },
  { href: "/app/load-map", icon: LayoutDashboard, label: "Load Map" },
  { href: "/app/library", icon: Library, label: "Library" },
  { href: "/app/radar", icon: Radar, label: "Radar" },
  { href: "/app/check-ins", icon: CalendarCheck, label: "Check-ins" },
  { href: "/app/crash-course", icon: Sparkles, label: "Crash course" },
  { href: "/app/settings", icon: Settings, label: "Settings" }
] as const;

const APP_SHELL_BACKGROUND =
  "/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png";

function isActiveRoute(pathname: string, href: string) {
  if (href === "/app/home") {
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
  const mainClassName = isImmersiveRoute
    ? "w-full pb-24 lg:pb-0"
    : "mx-auto w-full max-w-6xl bg-[length:min(820px,92vw)_auto] bg-right-top bg-no-repeat px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pr-44 lg:pt-8";

  return (
    <div className="min-h-screen bg-fp-paper text-fp-ink lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <LittleAlexPhysics
        chatPhrase={littleAlexPreferences.chatPhrase}
        genderPresentation={littleAlexPreferences.genderPresentation}
        skinTone={littleAlexPreferences.skinTone}
      />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-fp-line bg-[var(--fp-surface-strong)] px-4 py-5 shadow-[var(--fp-shadow-soft)] backdrop-blur lg:flex lg:flex-col">
        <Link
          className="flex min-w-0 items-center gap-3 rounded outline-none focus:ring-2 focus:ring-fp-ink/25"
          href="/app/home"
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
          {navItems.map((item) => {
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

        <Link
          className="mt-auto flex min-h-12 items-center gap-3 rounded border border-fp-line bg-[var(--fp-surface)] px-3 text-[13px] font-semibold outline-none transition hover:bg-[var(--fp-surface-strong)] focus:ring-2 focus:ring-fp-ink/25"
          href="/app/settings"
        >
          <PersonaAvatar
            className="fp-motion-persona-bob h-8 w-8 shrink-0 rounded-full"
            decorative
            persona={selectedPersona.key === "max" ? "max" : "alex"}
          />
          <span className="truncate">{selectedPersona.displayName}</span>
        </Link>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-10 border-b border-fp-line bg-[var(--fp-surface-strong)]/95 px-4 py-3 backdrop-blur sm:px-6 lg:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <Link
              className="flex min-w-0 items-center gap-3 rounded outline-none focus:ring-2 focus:ring-fp-ink/25"
              href="/app/home"
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
                  Fairplay
                </span>
              </span>
            </Link>

            <Link
              className="flex min-h-11 shrink-0 items-center gap-2 rounded border border-fp-line bg-white px-3 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-fp-ink/25"
              href="/app/settings"
            >
              <PersonaAvatar
                className="fp-motion-persona-bob h-7 w-7 shrink-0 rounded-full"
                decorative
                persona={selectedPersona.key === "max" ? "max" : "alex"}
              />
              {selectedPersona.displayName}
            </Link>
          </div>
        </header>

        <main
          className={mainClassName}
          data-layout={isImmersiveRoute ? "immersive" : "standard"}
          data-testid="app-main"
          style={
            isImmersiveRoute
              ? undefined
              : { backgroundImage: `url('${APP_SHELL_BACKGROUND}')` }
          }
        >
          {children}
        </main>

        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-10 border-t border-fp-line bg-[var(--fp-surface-strong)] px-2 py-2 shadow-[0_-10px_30px_rgba(32,33,36,0.08)] backdrop-blur lg:hidden"
        >
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(pathname, item.href);

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "grid min-h-12 min-w-[4.8rem] place-items-center gap-1 rounded px-2 text-center text-[11px] font-semibold leading-4 outline-none transition focus:ring-2 focus:ring-fp-ink/20",
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
          </div>
        </nav>
      </div>
    </div>
  );
}
