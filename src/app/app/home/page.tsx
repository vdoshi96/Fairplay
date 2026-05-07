import Link from "next/link";

import { FeatureGuideHelper } from "@/components/guide/feature-guide-helper";
import type { FeatureGuideId } from "@/components/guide/guide-content";
import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

const primaryActions = [
  {
    href: "/app/crash-course",
    label: "Crash course"
  },
  {
    href: "/app/library",
    label: "Card library"
  },
  {
    href: "/app/home#learn-a-feature",
    label: "Learn a feature"
  }
] as const;

const HOME_BACKGROUND =
  "/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png";

const featureCards: Array<{
  body: string;
  guideHref: string;
  guideId: FeatureGuideId;
  title: string;
}> = [
  {
    body: "See what is in play, what needs attention, and who owns each responsibility.",
    guideHref: "/app/load-map?guide=loadMap",
    guideId: "loadMap",
    title: "Load Map"
  },
  {
    body: "Create AI draft cards with greg, then browse source cards before deciding what belongs in your household system.",
    guideHref: "/app/library?guide=library",
    guideId: "library",
    title: "Library"
  },
  {
    body: "Capture unclear work, blockers, and topics that need calmer discussion.",
    guideHref: "/app/radar?guide=radar",
    guideId: "radar",
    title: "Radar"
  },
  {
    body: "Turn decisions into a short agenda with clear outcomes and next steps.",
    guideHref: "/app/check-ins/new?guide=checkIns",
    guideId: "checkIns",
    title: "Check-ins"
  },
  {
    body: "Replay welcome moments, switch personas, and restart learning surfaces.",
    guideHref: "/app/settings?guide=settings",
    guideId: "settings",
    title: "Settings"
  }
];

export default function AppHomePage() {
  return (
    <section
      className="relative grid gap-6 overflow-hidden rounded-[8px] border border-fp-line bg-white p-4 shadow-[var(--fp-shadow-soft)] sm:p-5"
      data-home-background
    >
      <DecorativeBackgroundLayer
        className="opacity-30 [mask-image:linear-gradient(115deg,black_0%,rgba(0,0,0,0.62)_48%,rgba(0,0,0,0.16)_100%)]"
        src={HOME_BACKGROUND}
        testId="home-learning-studio-background"
        washClassName="bg-white/70"
      />
      <div className="relative z-10 grid gap-6">
        <div className="grid gap-5 rounded-[8px] border border-white/70 bg-white/72 p-4 backdrop-blur-[1px] sm:p-5">
          <div className="grid max-w-2xl gap-2">
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
                aria-describedby={
                  action.href.endsWith("#learn-a-feature")
                    ? "learn-a-feature-heading"
                    : undefined
                }
                className="flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-white/95 px-4 text-[14px] font-bold text-fp-ink outline-none transition hover:bg-fp-soft focus:ring-2 focus:ring-fp-ink/25"
                href={action.href}
                key={action.href}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>

        <section
          className="relative z-10 grid scroll-mt-24 gap-3 rounded-[8px] border border-white/70 bg-white/82 p-4 backdrop-blur-[1px]"
          id="learn-a-feature"
        >
          <div className="grid gap-1">
            <h2
              className="text-[20px] font-bold leading-7 text-fp-ink"
              id="learn-a-feature-heading"
            >
              Learn a feature
            </h2>
            <p className="text-[14px] leading-5 text-fp-muted-ink">
              Pick a feature, learn the page, and come back here whenever you want
              the map again.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <article
                className="grid gap-3 rounded-[8px] border border-fp-line bg-white/95 p-4 shadow-sm"
                key={feature.title}
              >
                <div className="flex items-start gap-3">
                  <FeatureGuideHelper
                    className="h-16 w-20 shrink-0"
                    guideId={feature.guideId}
                  />
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
      </div>
    </section>
  );
}
