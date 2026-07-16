import Link from "next/link";

import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { HiddenEffortKey } from "@/domain/enums";

export type CheckInReviewResponsibility = Pick<
  ResponsibilitySummary,
  "id" | "nextReviewAt" | "status" | "title"
> & {
  hiddenEffortKeys: readonly HiddenEffortKey[];
};

type WorthReviewingProps = {
  responsibilities: readonly CheckInReviewResponsibility[];
  showNextCheckInAction?: boolean;
};

const hiddenEffortLabels: Record<HiddenEffortKey, string> = {
  noticing: "Noticing",
  planning: "Planning",
  doing: "Doing",
  follow_through: "Follow-through",
  emotional_attention: "Emotional attention"
};

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium"
  }).format(new Date(value));
}

function reviewTiming(responsibility: CheckInReviewResponsibility) {
  if (!responsibility.nextReviewAt) {
    return "Marked for review";
  }

  const formattedDate = formatReviewDate(responsibility.nextReviewAt);

  return responsibility.status === "needs_review"
    ? `Marked for review · Review date ${formattedDate}`
    : `Review due ${formattedDate}`;
}

export function WorthReviewing({
  responsibilities,
  showNextCheckInAction = true
}: WorthReviewingProps) {
  return (
    <section
      aria-labelledby="worth-reviewing-heading"
      className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-4 shadow-[var(--fp-shadow-soft)]"
    >
      <div className="grid gap-1">
        <h2
          className="text-[20px] font-bold leading-7 text-fp-ink"
          id="worth-reviewing-heading"
        >
          Worth reviewing
        </h2>
        <p className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
          A read-only reference for responsibilities that are ready for a check-in.
        </p>
      </div>

      {responsibilities.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {responsibilities.map((responsibility) => {
            const effortKeys = [...new Set(responsibility.hiddenEffortKeys)];

            return (
              <li
                className="grid content-start gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3"
                key={responsibility.id}
              >
                <div className="grid gap-1">
                  <h3 className="text-[16px] font-bold leading-6 text-fp-ink">
                    {responsibility.title}
                  </h3>
                  <p className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
                    {reviewTiming(responsibility)}
                  </p>
                </div>

                {effortKeys.length > 0 ? (
                  <div className="grid gap-2">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-fp-muted-ink">
                      Hidden effort
                    </p>
                    <ul
                      aria-label={`${responsibility.title} hidden effort`}
                      className="flex flex-wrap gap-2"
                      role="list"
                    >
                      {effortKeys.map((key) => (
                        <li
                          className="rounded-full border border-fp-line bg-[var(--fp-card)] px-2.5 py-1 text-[12px] font-bold text-fp-muted-ink"
                          key={key}
                        >
                          {hiddenEffortLabels[key]}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Link
                  aria-label={`View or update agreement for ${responsibility.title}`}
                  className="inline-flex min-h-11 items-center justify-center self-end rounded-[8px] border border-fp-line bg-[var(--fp-card)] px-3 text-center text-[13px] font-bold text-fp-ink underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]"
                  href={`/app/responsibilities/${responsibility.id}`}
                >
                  View or update agreement
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface)] p-3 text-[13px] font-semibold leading-5 text-fp-muted-ink">
          Nothing needs review right now. You can still schedule a check-in whenever it is useful.
        </p>
      )}

      {showNextCheckInAction && responsibilities.length > 0 ? (
        <a
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-primary px-4 text-center text-[14px] font-bold text-fp-on-primary transition hover:bg-fp-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] sm:justify-self-start"
          href="#schedule-check-in"
        >
          Schedule the next check-in
        </a>
      ) : null}
    </section>
  );
}
