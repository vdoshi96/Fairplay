import Link from "next/link";
import type { ReactNode } from "react";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import { FairplayMark, PersonaAvatar } from "@/components/visuals/fairplay-visuals";

type AppShellProps = {
  children: ReactNode;
  household: HouseholdSummary;
  selectedPersona: PersonaSummary;
};

const navItems = [
  { href: "/app/home", label: "Home" },
  { href: "/app/load-map", label: "Load Map" },
  { href: "/app/radar", label: "Radar" },
  { href: "/app/check-ins", label: "Check-ins" },
  { href: "/app/settings", label: "Settings" }
] as const;

export function AppShell({ children, household, selectedPersona }: AppShellProps) {
  return (
    <div className="min-h-screen bg-fp-paper text-fp-ink">
      <header className="sticky top-0 z-10 border-b border-fp-line bg-fp-paper/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            className="flex min-w-0 items-center gap-3 rounded-[8px] outline-none focus:ring-2 focus:ring-fp-ink/25"
            href="/app/home"
          >
            <FairplayMark
              className="h-10 w-10 shrink-0 rounded-[8px] border border-fp-line bg-white"
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
            className="flex min-h-11 shrink-0 items-center gap-2 rounded-[8px] border border-fp-line bg-white px-3 text-[13px] font-semibold outline-none focus:ring-2 focus:ring-fp-ink/25"
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

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 sm:pb-8">
        {children}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-fp-line bg-white px-2 py-2 sm:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              className="grid min-h-11 place-items-center rounded-[8px] px-1 text-center text-[11px] font-semibold leading-4 text-fp-muted-ink outline-none focus:bg-fp-surface focus:text-fp-ink focus:ring-2 focus:ring-fp-ink/20"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <nav
        aria-label="Primary"
        className="mx-auto hidden max-w-5xl gap-2 px-6 pb-6 sm:flex"
      >
        {navItems.map((item) => (
          <Link
            className="min-h-11 rounded-[8px] border border-fp-line bg-white px-3 py-2 text-[13px] font-semibold text-fp-muted-ink outline-none focus:ring-2 focus:ring-fp-ink/20"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
