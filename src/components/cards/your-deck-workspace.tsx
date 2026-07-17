"use client";

import Link from "next/link";
import { Archive, CheckCircle2, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { getCardsForPersona } from "./card-state";
import { CardBack } from "./card-back";
import { CardCoverImage } from "./card-cover-image";
import { humanize, searchCards } from "./card-workspace-helpers";
import type {
  CardWorkspaceCard,
  YourDeckWorkspaceProps
} from "./card-workspace-types";

export function YourDeckWorkspace({
  responsibilities,
  selectedPersona
}: YourDeckWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [cadenceFilter, setCadenceFilter] = useState<string>("all");
  const cards = getCardsForPersona(responsibilities, selectedPersona.key);
  const cadenceOptions = useMemo(
    () => ["all", ...Array.from(new Set(cards.map((card) => card.cadence)))],
    [cards]
  );
  const filteredCards = useMemo(
    () =>
      searchCards(cards, query).filter(
        (card) => cadenceFilter === "all" || card.cadence === cadenceFilter
      ),
    [cadenceFilter, cards, query]
  );
  const hasFilter = query.trim().length > 0 || cadenceFilter !== "all";

  return (
    <section className="grid gap-4">
      <header className="grid gap-1">
        <p className="text-[13px] font-bold text-fp-primary">
          {selectedPersona.displayName}
        </p>
        <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink sm:text-[36px] sm:leading-[42px]">
          Your Deck
        </h1>
        <p className="max-w-2xl text-[14px] font-semibold leading-6 text-fp-muted-ink">
          Find the cards that have been played to you here.
        </p>
      </header>

      {cards.length > 0 ? (
        <>
          <div className="fp-panel grid gap-3 p-3 sm:p-4">
            <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
              Search your deck
              <span className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fp-muted-ink"
                />
                <input
                  aria-label="Search your deck"
                  className="fp-input w-full py-2.5 pl-10 pr-3 text-[16px] font-semibold"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by title, area, standard"
                  type="search"
                  value={query}
                />
              </span>
            </label>
            <div
              aria-label="Card cadence filters"
              className="flex flex-wrap gap-2"
            >
              {cadenceOptions.map((cadence) => (
                <button
                  aria-pressed={cadenceFilter === cadence}
                  className={[
                    "min-h-11 rounded-[8px] border px-3 text-[13px] font-bold",
                    cadenceFilter === cadence
                      ? "border-fp-primary bg-fp-primary text-fp-on-primary"
                      : "border-fp-line bg-[var(--fp-surface)] text-fp-ink"
                  ].join(" ")}
                  key={cadence}
                  onClick={() => setCadenceFilter(cadence)}
                  type="button"
                >
                  {cadence === "all" ? "All" : humanize(cadence)}
                </button>
              ))}
            </div>
            <p className="text-[12px] font-bold text-fp-muted-ink">
              {filteredCards.length} of {cards.length} card
              {cards.length === 1 ? "" : "s"}
            </p>
          </div>
          {filteredCards.length > 0 ? (
            <div
              className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,10rem),1fr))] gap-3"
              data-testid="your-card-gallery"
            >
              {filteredCards.map((card) => (
                <CardFileItem card={card} key={card.id} />
              ))}
            </div>
          ) : (
            <section className="grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-5 text-center shadow-[var(--fp-shadow-soft)]">
              <Archive aria-hidden className="mx-auto h-9 w-9 text-fp-muted-ink" />
              <h2 className="text-[18px] font-bold text-fp-ink">
                No assigned cards match these filters.
              </h2>
              {hasFilter ? (
                <button
                  className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-4 text-[14px] font-bold text-fp-ink"
                  onClick={() => {
                    setQuery("");
                    setCadenceFilter("all");
                  }}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </section>
          )}
        </>
      ) : (
        <section className="grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-5 text-center shadow-[var(--fp-shadow-soft)]">
          <Archive aria-hidden className="mx-auto h-9 w-9 text-fp-muted-ink" />
          <h2 className="text-[18px] font-bold text-fp-ink">
            No cards dealt to you yet.
          </h2>
          <Link
            className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary"
            href="/app/distribute"
          >
            Deal cards
          </Link>
        </section>
      )}
    </section>
  );
}

function CardFileItem({
  card
}: {
  card: CardWorkspaceCard;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article className="grid min-h-[20rem] grid-rows-[minmax(0,1fr)_auto] overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card)] text-left text-fp-ink shadow-[var(--fp-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--fp-shadow-elevated)]">
      <button
        aria-label={card.title}
        aria-pressed={flipped}
        className="grid min-h-0 min-w-0 overflow-hidden text-left"
        onClick={() => setFlipped((current) => !current)}
        type="button"
      >
        {flipped ? (
          <CardBack card={card} className="p-4" />
        ) : (
          <div className="grid grid-rows-[minmax(0,1fr)_auto]">
            <CardCoverImage card={card} className="min-h-0 bg-fp-surface p-2" />
            <div className="grid gap-2 p-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[18px] font-bold leading-6 [overflow-wrap:anywhere]">
                  {card.title}
                </h2>
                <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-[var(--fp-alex)]" />
              </div>
              <p className="line-clamp-2 text-[12px] font-semibold leading-5 text-fp-muted-ink">
                {card.areaKeys.map(humanize).slice(0, 3).join(" / ") || "Household"}
              </p>
              <p className="text-[12px] font-bold text-fp-muted-ink">Tap to flip</p>
            </div>
          </div>
        )}
      </button>
      {flipped ? (
        <Link
          className="inline-flex min-h-11 items-center justify-center border-t border-fp-line bg-[var(--fp-card)] px-3 text-center text-[13px] font-bold text-fp-ink underline-offset-4 hover:underline"
          href={`/app/responsibilities/${card.id}`}
        >
          View or update agreement
        </Link>
      ) : null}
    </article>
  );
}
