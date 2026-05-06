"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { AiCardDraftSummary } from "@/contracts/ai-card-drafts";
import type {
  CardTemplateLabel,
  CardTemplateSummary
} from "@/contracts/card-templates";
import { CARD_TEMPLATE_LABELS } from "@/contracts/card-templates";
import { FEATURE_GUIDES } from "@/components/guide/guide-content";
import { FeatureGuideLauncher } from "@/components/guide/feature-guide-launcher";
import { AiTaskManager } from "@/components/library/ai-task-manager";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

type CardLibraryProps = {
  templates: CardTemplateSummary[];
  aiDrafts?: AiCardDraftSummary[];
  onCreateFromTemplate?: (templateId: string) => void;
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
  "url('/assets/fairplay/generated-ui/backgrounds/library-shelf.png')";

export function CardLibrary({
  aiDrafts = [],
  templates,
  onCreateFromTemplate
}: CardLibraryProps) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<CardTemplateLabel | "all">(
    "all"
  );

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
        className="overflow-hidden rounded-[8px] border border-fp-line bg-fp-ink bg-cover bg-center shadow-[var(--fp-shadow-soft)]"
        data-testid="library-shelf-visual"
        style={{ backgroundImage: libraryShelfBackground }}
      >
        <div className="bg-gradient-to-r from-white/95 via-white/88 to-white/58 p-4">
          <AiTaskManager drafts={aiDrafts} />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-end">
        <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
          Search cards
          <input
            aria-label="Search cards"
            className="min-h-11 rounded border border-fp-line bg-white px-3 text-[15px] text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
            data-guide-id="library-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Auto, school, meals..."
            type="search"
            value={query}
          />
        </label>
        <div className="grid gap-3 lg:justify-items-end">
          <FeatureGuideLauncher guide={FEATURE_GUIDES.library} showDescription={false} />
          <p className="text-[13px] font-semibold text-fp-muted-ink">
            {filteredTemplates.length} of {templates.length} cards
          </p>
        </div>
      </div>

      <div
        aria-label="Source labels"
        className="flex gap-2 overflow-x-auto pb-1"
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
              className="grid min-h-[420px] grid-rows-[192px_1fr_auto] overflow-hidden rounded border border-fp-line bg-white shadow-[var(--fp-shadow-soft)]"
              key={template.id}
            >
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
              <div className="grid content-start gap-3 p-4">
                <div className="flex flex-wrap gap-2">
                  {template.labels.map((label) => (
                    <Chip key={label} tone={labelTone[label]}>
                      {label}
                    </Chip>
                  ))}
                </div>
                <div className="grid gap-2">
                  <h2 className="line-clamp-2 text-[20px] font-bold leading-6 text-fp-ink">
                    {template.title}
                  </h2>
                  <p className="line-clamp-4 text-[14px] leading-6 text-fp-muted-ink">
                    {template.summary}
                  </p>
                </div>
              </div>
              <div className="border-t border-fp-line p-4">
                <Button
                  className="w-full"
                  data-guide-id={index === 0 ? "library-put-in-play" : undefined}
                  disabled={!onCreateFromTemplate}
                  onClick={() => onCreateFromTemplate?.(template.id)}
                  variant="primary"
                >
                  Put {template.title} in play
                </Button>
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

function filterButtonClass(active: boolean) {
  return [
    "inline-flex min-h-10 shrink-0 items-center rounded border px-3 text-[13px] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
    active
      ? "border-fp-primary bg-fp-primary text-fp-on-primary"
      : "border-fp-line bg-white text-fp-ink hover:bg-fp-surface"
  ].join(" ");
}
