"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookOpen, GraduationCap, Sparkles, X } from "lucide-react";

type PersistentWelcomeProps = {
  dismissed: boolean;
  onDismiss?: () => void;
};

const welcomeLinks = [
  {
    href: "/app/crash-course",
    icon: Sparkles,
    label: "Start crash course"
  },
  {
    href: "/app/home#app-guide-101",
    icon: GraduationCap,
    label: "Open App Guide 101"
  },
  {
    href: "/app/library",
    icon: BookOpen,
    label: "Browse card library"
  }
] as const;

export function PersistentWelcome({
  dismissed,
  onDismiss
}: PersistentWelcomeProps) {
  const [hidden, setHidden] = useState(dismissed);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHidden(dismissed);
  }, [dismissed]);

  async function closeWelcome() {
    setClosing(true);
    setError(null);

    try {
      const response = await fetch("/api/preferences/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          welcomeDismissedAt: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("dismiss");
      }

      setHidden(true);
      onDismiss?.();
    } catch {
      setError("Unable to close welcome right now. Please try again.");
    } finally {
      setClosing(false);
    }
  }

  if (hidden) {
    return null;
  }

  return (
    <aside
      aria-label="Welcome to Fairplay"
      className="mb-5 rounded-[8px] border border-fp-line bg-white p-4 shadow-soft"
      role="dialog"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
            Welcome
          </p>
          <h2 className="text-[22px] font-bold leading-7 text-fp-ink">
            Welcome to Fairplay
          </h2>
          <p className="max-w-3xl text-[15px] leading-6 text-fp-muted-ink">
            Start with the course, browse the full card library, or open App
            Guide 101. This welcome stays here until you close it.
          </p>
        </div>

        <button
          aria-label="Close welcome"
          className="min-h-10 min-w-10 justify-self-start rounded-[8px] border border-fp-line bg-white text-fp-muted-ink outline-none transition hover:bg-fp-soft hover:text-fp-ink focus:ring-2 focus:ring-fp-ink/25 disabled:cursor-not-allowed disabled:opacity-60 sm:justify-self-end"
          disabled={closing}
          onClick={() => void closeWelcome()}
          type="button"
        >
          <X aria-hidden className="mx-auto h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {welcomeLinks.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              className="flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-fp-line bg-fp-surface px-3 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25"
              href={item.href}
              key={item.href}
            >
              <Icon aria-hidden className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {error ? (
        <p
          className="mt-3 rounded-[8px] border border-fp-danger/40 bg-white px-3 py-2 text-[14px] leading-5 text-fp-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </aside>
  );
}
