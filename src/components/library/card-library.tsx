"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type {
  CardTemplateLabel,
  CardTemplateSummary
} from "@/contracts/card-templates";
import { CARD_TEMPLATE_LABELS } from "@/contracts/card-templates";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { CardDistributionBucket } from "@/components/cards/card-state";
import { CARD_BUCKET_LABELS, type CardBucket } from "@/components/cards/card-state";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import { AiTaskManager } from "@/components/library/ai-task-manager";
import { Chip } from "@/components/ui/chip";
import { DecorativeBackgroundLayer } from "@/components/visuals/fairplay-visuals";

export type LibraryCardTemplate = CardTemplateSummary & {
  definition?: string | null;
  minimumStandard?: string | null;
};

type CardLibraryProps = {
  templates: LibraryCardTemplate[];
  aiDrafts?: AiCardDraftSummary[];
  availableCards?: ResponsibilitySummary[];
  onCreateFromTemplate?: (
    templateId: string,
    bucket: CardDistributionBucket
  ) => void;
};

const labelTone: Record<CardTemplateLabel, Parameters<typeof Chip>[0]["tone"]> = {
  Caregiving: "caregiving",
  "Daily Grind": "daily",
  Out: "out",
  Home: "home",
  Magic: "magic",
  Wild: "wild",
  "Happiness Trio": "happiness",
  Kids: "kids",
  "Kid Split": "kid-split"
};

const libraryShelfBackground =
  "/assets/fairplay/generated-ui/backgrounds/library-shelf.png";
const assignBuckets = [
  "alex",
  "max",
  "savedForLater",
  "notApplicable",
  "unassigned"
] as const;

export function CardLibrary({
  aiDrafts = [],
  availableCards = [],
  templates,
  onCreateFromTemplate
}: CardLibraryProps) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<CardTemplateLabel | "all">(
    "all"
  );
  const [flippedIds, setFlippedIds] = useState<Set<string>>(() => new Set());

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        template.title.toLowerCase().includes(normalizedQuery) ||
        template.summary.toLowerCase().includes(normalizedQuery) ||
        template.labels.some((label) =>
          label.toLowerCase().includes(normalizedQuery)
        );
      const matchesLabel =
        selectedLabel === "all" || template.labels.includes(selectedLabel);

      return matchesQuery && matchesLabel;
    });
  }, [query, selectedLabel, templates]);

  return (
    <section className="grid gap-5">
      <div
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink shadow-[var(--fp-shadow-soft)]"
        data-testid="library-shelf-visual"
      >
        <DecorativeBackgroundLayer
          className="opacity-50 [mask-image:linear-gradient(115deg,black_0%,rgba(0,0,0,0.68)_52%,rgba(0,0,0,0.2)_100%)]"
          src={libraryShelfBackground}
          testId="library-shelf-background"
          washClassName="fp-page-hero-wash"
        />
        <div className="fp-generated-surface-wash relative z-10 p-4 backdrop-blur-[1px]">
          <AiTaskManager drafts={aiDrafts} />
        </div>
      </div>

      <AvailableCardsShelf cards={availableCards} />

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-end">
        <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
          Search
          <input
            aria-label="Search cards"
            className="min-h-11 rounded border border-fp-line bg-white px-3 text-[15px] text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
            data-guide-id="library-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Meals, school, auto"
            type="search"
            value={query}
          />
        </label>
        <div className="grid gap-3 lg:justify-items-end">
          <FeatureGuideLauncher
            guide={FEATURE_GUIDES.library}
            showDescription={false}
            showHelper={false}
          />
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            {filteredTemplates.length} / {templates.length} cards
          </p>
        </div>
      </div>

      <div
        aria-label="Card labels"
        className="flex flex-wrap gap-2 pb-1"
        data-guide-id="library-labels"
      >
        <button
          className={filterButtonClass(selectedLabel === "all")}
          onClick={() => setSelectedLabel("all")}
          type="button"
        >
          All
        </button>
        {CARD_TEMPLATE_LABELS.map((label) => (
          <button
            className={filterButtonClass(selectedLabel === label)}
            key={label}
            onClick={() => setSelectedLabel(label)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {filteredTemplates.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <article
              aria-label={template.title}
              className="grid min-h-[430px] min-w-0 grid-rows-[1fr_auto] overflow-hidden rounded-[8px] border border-fp-line bg-white shadow-[var(--fp-shadow-soft)]"
              key={template.id}
            >
              <button
                aria-label={
                  flippedIds.has(template.id)
                    ? `Show front of ${template.title}`
                    : `Flip ${template.title}`
                }
                aria-pressed={flippedIds.has(template.id)}
                className="grid min-w-0 text-left outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--fp-focus)]"
                onClick={() =>
                  setFlippedIds((current) => {
                    const next = new Set(current);
                    if (next.has(template.id)) {
                      next.delete(template.id);
                    } else {
                      next.add(template.id);
                    }
                    return next;
                  })
                }
                type="button"
              >
                {flippedIds.has(template.id) ? (
                  <LibraryCardBack template={template} />
                ) : (
                  <LibraryCardFront template={template} />
                )}
              </button>

              <div className="grid gap-2 border-t border-fp-line bg-[var(--fp-surface-strong)] p-3">
                <p className="text-[12px] font-bold text-fp-muted-ink">
                  Choose lane
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {assignBuckets.map((bucket, bucketIndex) => (
                    <button
                      className="min-h-11 rounded-[8px] border border-fp-line bg-white px-2 text-[12px] font-bold text-fp-ink shadow-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                      data-guide-id={
                        index === 0 && bucketIndex === 0
                          ? "library-put-in-play"
                          : undefined
                      }
                      disabled={!onCreateFromTemplate}
                      key={bucket}
                      onClick={() => onCreateFromTemplate?.(template.id, bucket)}
                      type="button"
                    >
                      {CARD_BUCKET_LABELS[bucket]}
                    </button>
                  ))}
                </div>
                <p className="text-[12px] font-semibold leading-5 text-fp-muted-ink">
                  Tap the card for purpose and Fogging E-Standards.
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-fp-line bg-white p-6 text-[15px] font-semibold text-fp-muted-ink">
          No cards match the current filters.
        </div>
      )}
    </section>
  );
}

function AvailableCardsShelf({ cards }: { cards: ResponsibilitySummary[] }) {
  return (
    <section
      aria-label="Cards ready to deal"
      className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 shadow-[var(--fp-shadow-soft)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-[18px] font-bold text-fp-ink">
            Cards ready to deal
          </h2>
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            {cards.length} unclassified card{cards.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-fp-primary px-3 text-[13px] font-bold text-fp-on-primary"
          href="/app/distribute"
        >
          Open Deal
        </Link>
      </div>
      {cards.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {cards.slice(0, 8).map((card) => (
            <article
              aria-label={card.title}
              className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-[8px] border border-fp-line bg-white p-2"
              key={card.id}
            >
              <LibraryResponsibilityCover card={card} />
              <div className="grid min-w-0 content-center gap-1">
                <h3 className="line-clamp-2 text-[13px] font-bold leading-5 text-fp-ink">
                  {card.title}
                </h3>
                <p className="text-[11px] font-semibold text-fp-muted-ink">
                  {card.areaKeys.slice(0, 2).join(" / ") || "Household"}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-[8px] border border-dashed border-fp-line bg-white p-3 text-[13px] font-semibold text-fp-muted-ink">
          No unclassified cards are waiting right now.
        </p>
      )}
    </section>
  );
}

function LibraryResponsibilityCover({ card }: { card: ResponsibilitySummary }) {
  if (!card.sourceCoverAssetPath) {
    return (
      <div
        aria-label={`${card.title} cover`}
        className="grid aspect-[5/7] place-items-center rounded-[8px] border border-fp-line bg-[var(--fp-surface)] text-center text-[11px] font-bold text-fp-muted-ink"
        role="img"
      >
        Cover
      </div>
    );
  }

  return (
    <div className="aspect-[5/7] overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-1">
      <Image
        alt={`${card.title} cover`}
        className="h-full w-full object-contain"
        height={700}
        src={card.sourceCoverAssetPath}
        unoptimized
        width={500}
      />
    </div>
  );
}

function LibraryCardFront({ template }: { template: LibraryCardTemplate }) {
  return (
    <div className="grid min-h-[286px] grid-rows-[168px_1fr]">
      <div className="relative overflow-hidden bg-fp-surface">
        <Image
          alt={`${template.title} cover`}
          className="h-full w-full object-contain p-3"
          height={700}
          src={template.coverAssetPath}
          unoptimized
          width={500}
        />
      </div>
      <div className="grid min-w-0 content-start gap-3 overflow-hidden p-4">
        <div className="flex flex-wrap gap-2">
          {template.labels.map((label) => (
            <Chip key={label} tone={labelTone[label]}>
              {label}
            </Chip>
          ))}
        </div>
        <div className="grid gap-2">
          <h2 className="line-clamp-2 text-[18px] font-bold leading-6 text-fp-ink [overflow-wrap:anywhere]">
            {template.title}
          </h2>
          <p className="line-clamp-3 text-[14px] leading-6 text-fp-muted-ink [overflow-wrap:anywhere]">
            {template.summary}
          </p>
        </div>
      </div>
    </div>
  );
}

function LibraryCardBack({ template }: { template: LibraryCardTemplate }) {
  return (
    <div className="grid min-h-[286px] content-start gap-3 bg-[var(--fp-surface-strong)] p-4">
      <header className="grid gap-2">
        <p className="text-[12px] font-bold uppercase text-fp-muted-ink">
          Card back
        </p>
        <h2 className="line-clamp-2 text-[20px] font-bold leading-7 text-fp-ink [overflow-wrap:anywhere]">
          {template.title}
        </h2>
        <div className="flex flex-wrap gap-2">
          {template.labels.slice(0, 3).map((label) => (
            <Chip key={label} tone={labelTone[label]}>
              {label}
            </Chip>
          ))}
          <span className="rounded-full border border-fp-line bg-white px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
            {CARD_BUCKET_LABELS[bucketForTemplateLane(template.defaultLane)]}
          </span>
        </div>
      </header>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-white p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          What is this card for?
        </h3>
        <p className="line-clamp-5 text-[13px] leading-5 text-fp-muted-ink">
          {template.definition ?? template.summary}
        </p>
      </section>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-white p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          Fogging E-Standards
        </h3>
        <p className="line-clamp-4 text-[13px] leading-5 text-fp-muted-ink">
          {template.minimumStandard ??
            "Agree on a lightweight standard before assigning this card."}
        </p>
      </section>
    </div>
  );
}

function bucketForTemplateLane(lane: CardTemplateSummary["defaultLane"]): CardBucket {
  if (lane === "player_1") {
    return "alex";
  }

  if (lane === "player_2") {
    return "max";
  }

  if (lane === "trimmed") {
    return "notApplicable";
  }

  if (lane === "not_in_play") {
    return "savedForLater";
  }

  return "unassigned";
}

function filterButtonClass(active: boolean) {
  return [
    "inline-flex min-h-10 shrink-0 items-center rounded border px-3 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
    active
      ? "border-fp-primary bg-fp-primary text-fp-on-primary"
      : "border-fp-line bg-white text-fp-ink hover:bg-fp-surface"
  ].join(" ");
}
