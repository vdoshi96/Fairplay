"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type {
  CardTemplateLabel,
  CardTemplateSummary
} from "@/contracts/card-templates";
import { CARD_TEMPLATE_LABELS } from "@/contracts/card-templates";
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
export function CardLibrary({
  aiDrafts = [],
  templates
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
        className="relative overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card-muted)] shadow-[var(--fp-shadow-crisp)]"
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

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-end">
        <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
          Search
          <input
            aria-label="Search cards"
            className="fp-input px-3 text-[15px] font-medium"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Meals, school, auto"
            type="search"
            value={query}
          />
        </label>
        <p className="text-[13px] font-semibold text-fp-muted-ink lg:justify-self-end">
          {filteredTemplates.length} / {templates.length} cards
        </p>
      </div>

      <div
        aria-label="Card labels"
        className="flex flex-wrap gap-2 pb-1"
      >
        <button
          aria-pressed={selectedLabel === "all"}
          className={filterButtonClass(selectedLabel === "all")}
          onClick={() => setSelectedLabel("all")}
          type="button"
        >
          All
        </button>
        {CARD_TEMPLATE_LABELS.map((label) => (
          <button
            aria-pressed={selectedLabel === label}
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
          {filteredTemplates.map((template) => (
            <article
              aria-label={template.title}
              className="grid min-h-[430px] min-w-0 grid-rows-[1fr_auto] overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--fp-shadow-elevated)]"
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
                <p className="text-[12px] font-semibold leading-5 text-fp-muted-ink">
                  Library card
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-card)] p-6 text-[15px] font-semibold text-fp-muted-ink">
          No cards match the current filters.
        </div>
      )}
    </section>
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
        </div>
      </header>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          What is this card for?
        </h3>
        <p className="line-clamp-5 text-[13px] leading-5 text-fp-muted-ink">
          {template.definition ?? template.summary}
        </p>
      </section>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          Fogging Estandards
        </h3>
        <p className="line-clamp-4 text-[13px] leading-5 text-fp-muted-ink">
          {template.minimumStandard ??
            "Agree on a lightweight standard before assigning this card."}
        </p>
      </section>
    </div>
  );
}

function filterButtonClass(active: boolean) {
  return [
    "inline-flex min-h-11 shrink-0 items-center rounded-[8px] border px-3 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
    active
      ? "border-fp-primary bg-fp-primary text-fp-on-primary"
      : "border-fp-line bg-[var(--fp-surface)] text-fp-ink hover:bg-[var(--fp-surface-strong)]"
  ].join(" ");
}
