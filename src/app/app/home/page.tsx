import Link from "next/link";

import { HelperMascot } from "@/components/visuals/fairplay-visuals";

const primaryActions = [
  {
    href: "/app/crash-course",
    label: "Crash course"
  },
  {
    href: "/app/home#app-guide-101",
    label: "App Guide 101"
  },
  {
    href: "/app/library",
    label: "Card library"
  }
] as const;

const featureCards = [
  {
    body: "See what is in play, what needs attention, and who owns each responsibility.",
    guideHref: "/app/load-map?guide=loadMap",
    title: "Load Map"
  },
  {
    body: "Browse source cards before deciding what belongs in your household system.",
    guideHref: "/app/library?guide=library",
    title: "Library"
  },
  {
    body: "Capture unclear work, blockers, and topics that need calmer discussion.",
    guideHref: "/app/radar?guide=radar",
    title: "Radar"
  },
  {
    body: "Turn decisions into a short agenda with clear outcomes and next steps.",
    guideHref: "/app/check-ins/new?guide=checkIns",
    title: "Check-ins"
  },
  {
    body: "Replay welcome moments, switch personas, and restart learning surfaces.",
    guideHref: "/app/settings?guide=settings",
    title: "Settings"
  }
] as const;

export default function AppHomePage() {
  return (
    <section className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
          Learning hub
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Learn Fairplay in layers
        </h1>
        <p className="text-[15px] leading-6 text-fp-muted-ink">
          Start with the big picture, then revisit each feature when the moment
          is real. The guide links open short tours on the pages where the work
          happens.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {primaryActions.map((action) => (
          <Link
            className="flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25"
            href={action.href}
            key={action.href}
          >
            {action.label}
          </Link>
        ))}
      </div>

      <section className="grid gap-3" id="app-guide-101">
        <div className="grid gap-1">
          <h2 className="text-[20px] font-bold leading-7 text-fp-ink">
            App Guide 101
          </h2>
          <p className="text-[14px] leading-5 text-fp-muted-ink">
            Pick a feature, learn the page, and come back here whenever you want
            the map again.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature) => (
            <article
              className="grid gap-3 rounded-[8px] border border-fp-line bg-white p-4"
              key={feature.title}
            >
              <div className="flex items-start gap-3">
                <HelperMascot className="h-14 w-14 shrink-0" decorative />
                <div className="min-w-0">
                  <h3 className="text-[17px] font-bold leading-6 text-fp-ink">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-5 text-fp-muted-ink">
                    {feature.body}
                  </p>
                </div>
              </div>
              <Link
                aria-label={`Learn this feature: ${feature.title}`}
                className="justify-self-start rounded-[8px] border border-fp-line bg-fp-surface px-3 py-2 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25"
                href={feature.guideHref}
              >
                Learn this feature
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
