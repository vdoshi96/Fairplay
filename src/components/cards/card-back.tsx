import {
  CARD_BUCKET_LABELS,
  bucketForCard
} from "./card-state";
import {
  assignmentLabelFor,
  cardPurpose,
  cardStandards,
  formatCardReviewDate,
  humanize
} from "./card-workspace-helpers";
import type { CardWorkspaceCard } from "./card-workspace-types";

export function CardBack({
  card,
  className
}: {
  card: CardWorkspaceCard;
  className?: string;
}) {
  const bucket = bucketForCard(card);

  return (
    <div
      className={[
        "grid h-full content-start gap-3 overflow-y-auto bg-[var(--fp-surface-strong)]",
        className ?? ""
      ].join(" ")}
    >
      <header className="grid gap-2">
        <p className="text-[12px] font-bold uppercase text-fp-muted-ink">
          Card back
        </p>
        <h2 className="text-[22px] font-bold leading-7 text-fp-ink [overflow-wrap:anywhere]">
          {card.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
            Assigned to {assignmentLabelFor(card)}
          </span>
          <span className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
            {CARD_BUCKET_LABELS[bucket]}
          </span>
        </div>
      </header>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          What is this card for?
        </h3>
        <p className="whitespace-pre-wrap text-[13px] leading-5 text-fp-muted-ink [overflow-wrap:anywhere]">
          {cardPurpose(card)}
        </p>
      </section>

      <section className="grid gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">Full ownership includes</h3>
        <dl className="grid gap-2 text-[12px] leading-5 text-fp-muted-ink">
          {[
            ["Conception", card.sourceConception],
            ["Planning", card.sourcePlanning],
            ["Execution", card.sourceExecution]
          ].map(([phase, value]) => (
            <div className="grid gap-0.5" key={phase}>
              <dt className="font-bold text-fp-ink">{phase}</dt>
              <dd className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                {value || `No ${phase?.toLowerCase()} notes yet.`}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-1.5" aria-label="Hidden effort">
          {card.hiddenEffortKeys.map((effort) => (
            <span
              className="rounded-full border border-fp-line bg-[var(--fp-card)] px-2 py-1 text-[11px] font-bold text-fp-muted-ink"
              key={effort}
            >
              {humanize(effort)}
            </span>
          ))}
        </div>
        <p className="text-[12px] font-semibold text-fp-muted-ink">
          {card.nextReviewAt
            ? `Review by ${formatCardReviewDate(card.nextReviewAt)}`
            : "No review date set."}
        </p>
      </section>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          Fogging Estandards
        </h3>
        <p className="whitespace-pre-wrap text-[13px] leading-5 text-fp-muted-ink [overflow-wrap:anywhere]">
          {cardStandards(card)}
        </p>
      </section>
    </div>
  );
}
