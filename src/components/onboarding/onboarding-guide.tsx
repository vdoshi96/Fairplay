"use client";

import { SAFETY_COPY } from "@/lib/safety-copy";

type OnboardingGuideProps = {
  onSkip: () => void;
};

const steps = [
  {
    title: "Map responsibilities",
    body: "Start with a few real household responsibilities in your own words."
  },
  {
    title: "Assign ownership",
    body: "Name who carries the outcome, who helps, and when to revisit the plan."
  },
  {
    title: "Add radar concerns",
    body: "Capture blockers or unclear expectations without turning them into blame."
  },
  {
    title: "Schedule a check-in",
    body: "Review what changed, what is blocked, and what needs a next decision."
  }
] as const;

export function OnboardingGuide({ onSkip }: OnboardingGuideProps) {
  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6">
      <div className="grid gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.04em] text-fp-muted-ink">
          First setup
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Set up your household rhythm
        </h1>
        <p className="text-[15px] leading-6 text-fp-muted-ink">
          Fairplay is for practical household planning: make work visible, clarify
          ownership, and return to decisions when capacity changes.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((step, index) => (
          <article
            className="rounded-[8px] border border-fp-line bg-white p-4"
            key={step.title}
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-fp-surface text-[13px] font-bold text-fp-ink">
              {index + 1}
            </span>
            <h2 className="mt-3 text-[17px] font-bold leading-6 text-fp-ink">
              {step.title}
            </h2>
            <p className="mt-1 text-[14px] leading-5 text-fp-muted-ink">
              {step.body}
            </p>
          </article>
        ))}
      </div>

      <aside className="rounded-[8px] border border-fp-caution/40 bg-white p-4">
        <h2 className="text-[17px] font-bold leading-6 text-fp-ink">
          Keep sharing intentional
        </h2>
        <p className="mt-2 text-[14px] leading-5 text-fp-muted-ink">
          {SAFETY_COPY.unsafeRelationshipCaution}
        </p>
      </aside>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          className="grid min-h-11 place-items-center rounded-[8px] bg-fp-ink px-4 text-center text-[14px] font-semibold text-white outline-none focus:ring-2 focus:ring-fp-ink/30"
          href="/app/load-map"
        >
          Start with load map
        </a>
        <button
          className="min-h-11 rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-semibold text-fp-ink outline-none focus:ring-2 focus:ring-fp-ink/25"
          onClick={onSkip}
          type="button"
        >
          Skip for now
        </button>
      </div>
    </section>
  );
}
