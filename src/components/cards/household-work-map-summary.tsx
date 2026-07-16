import type {
  HouseholdWorkMap,
  HouseholdWorkMapHiddenEffort,
  PersonaWorkMapSummary
} from "@/contracts/household-work-map";

type HouseholdWorkMapSummaryProps = {
  variant: "board" | "deal";
  workMap: HouseholdWorkMap;
};

const HIDDEN_EFFORT_LABELS: Record<keyof HouseholdWorkMapHiddenEffort, string> = {
  noticing: "Noticing",
  planning: "Planning",
  doing: "Doing",
  follow_through: "Follow-through",
  emotional_attention: "Emotional attention"
};

export function HouseholdWorkMapSummary({
  variant,
  workMap
}: HouseholdWorkMapSummaryProps) {
  if (variant === "deal") {
    return (
      <details
        className="rounded-[8px] border border-fp-line bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)] [&>summary::-webkit-details-marker]:hidden"
        data-testid="deal-work-map"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-[8px] px-3 py-2 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] sm:px-4">
          <span className="grid gap-0.5">
            <span className="text-[14px] font-bold text-fp-ink">
              Household work in view
            </span>
            <span className="text-[12px] font-semibold text-fp-muted-ink">
              Reference before assigning this card
            </span>
          </span>
          <span
            aria-hidden
            className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-2.5 py-1 text-[12px] font-bold text-fp-muted-ink"
          >
            View
          </span>
        </summary>
        <div className="grid gap-3 border-t border-fp-line p-3 sm:p-4">
          <WorkMapContext />
          <WorkMapContent compact workMap={workMap} />
        </div>
      </details>
    );
  }

  return (
    <section
      aria-labelledby="household-work-map-heading"
      className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-3 shadow-[var(--fp-shadow-soft)] sm:p-4"
      data-testid="board-work-map"
    >
      <header className="grid gap-1">
        <h2
          className="text-[17px] font-bold leading-6 text-fp-ink"
          id="household-work-map-heading"
        >
          Household work map
        </h2>
        <WorkMapContext />
      </header>
      <WorkMapContent workMap={workMap} />
    </section>
  );
}

function WorkMapContext() {
  return (
    <p className="text-[12px] font-semibold leading-5 text-fp-muted-ink">
      Persona totals use active and needs-review work. Household totals also
      show cards outside active work. Counts describe responsibilities, not people.
    </p>
  );
}

function WorkMapContent({
  compact = false,
  workMap
}: {
  compact?: boolean;
  workMap: HouseholdWorkMap;
}) {
  return (
    <div
      className={[
        "grid gap-3",
        compact ? "xl:grid-cols-[1fr_1fr_1.2fr]" : "lg:grid-cols-[1fr_1fr_1.2fr]"
      ].join(" ")}
    >
      <PersonaSummaryCard
        name="Alex"
        summary={workMap.personas.alex}
        tone="alex"
      />
      <PersonaSummaryCard
        name="Max"
        summary={workMap.personas.max}
        tone="max"
      />
      <HouseholdTotals workMap={workMap} />
    </div>
  );
}

function PersonaSummaryCard({
  name,
  summary,
  tone
}: {
  name: string;
  summary: PersonaWorkMapSummary;
  tone: "alex" | "max";
}) {
  const hiddenEffort = Object.entries(summary.hiddenEffort).filter(
    ([, count]) => count > 0
  ) as Array<[keyof HouseholdWorkMapHiddenEffort, number]>;

  return (
    <section
      aria-label={`${name} responsibility summary`}
      className={[
        "grid gap-2 rounded-[8px] border bg-[var(--fp-surface-strong)] p-3",
        tone === "alex"
          ? "border-[color:var(--fp-alex)]/35"
          : "border-[color:var(--fp-max)]/35"
      ].join(" ")}
    >
      <h3 className="text-[14px] font-bold text-fp-ink">{name}</h3>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
        <WorkMapMetric label="Owned" value={summary.owned} />
        <WorkMapMetric label="Shared-owned" value={summary.sharedOwned} />
        <WorkMapMetric label="Daily or weekly" value={summary.highFrequency} />
        <WorkMapMetric label="Due for review" value={summary.dueReview} />
      </dl>
      <div className="grid gap-1 border-t border-fp-line pt-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-fp-muted-ink">
          Hidden effort in owned work
        </p>
        {hiddenEffort.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label={`${name} hidden effort`}>
            {hiddenEffort.map(([key, count]) => (
              <li
                className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-2 py-1 text-[11px] font-bold text-fp-muted-ink"
                key={key}
              >
                {HIDDEN_EFFORT_LABELS[key]} {count}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[12px] font-semibold text-fp-muted-ink">
            None recorded
          </p>
        )}
      </div>
    </section>
  );
}

function HouseholdTotals({ workMap }: { workMap: HouseholdWorkMap }) {
  const { household } = workMap;

  return (
    <section
      aria-label="Household responsibility summary"
      className="grid gap-2 rounded-[8px] border border-[color:var(--fp-shared)]/35 bg-[color:var(--fp-shared)]/10 p-3"
    >
      <h3 className="text-[14px] font-bold text-fp-ink">Across the household</h3>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <WorkMapMetric label="Shared" value={household.shared} />
        <WorkMapMetric label="No owner" value={household.unassigned} />
        <WorkMapMetric label="Due for review" value={household.dueReview} />
        <WorkMapMetric label="Paused" value={household.paused} />
        <WorkMapMetric label="Not applicable" value={household.notApplicable} />
      </dl>
    </section>
  );
}

function WorkMapMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid content-start gap-0.5">
      <dt className="order-2 text-[11px] font-semibold leading-4 text-fp-muted-ink">
        {label}
      </dt>
      <dd className="order-1 text-[18px] font-bold tabular-nums leading-5 text-fp-ink">
        {value}
      </dd>
    </div>
  );
}
