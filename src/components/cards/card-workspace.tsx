"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Archive,
  CheckCircle2,
  Search,
  Sparkles
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";

import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { CardBucket, CardDistributionBucket, CardDistributionMove } from "./card-state";
import {
  CARD_BUCKET_HELP,
  CARD_BUCKET_LABELS,
  CARD_BUCKET_TONES,
  bucketForCard,
  getCardsForPersona,
  getDistributableCards,
  groupCardsByBucket
} from "./card-state";

type CardWorkspaceProps = {
  onDistribute?: (move: CardDistributionMove) => Promise<void> | void;
  responsibilities: CardWorkspaceCard[];
  selectedPersona: PersonaSummary;
  view: "board" | "distribute" | "yourCards";
};

type CardWorkspaceCard = ResponsibilitySummary & {
  householdStandard?: string | null;
  sourceDefinition?: string | null;
  sourceMinimumStandard?: string | null;
  sourceCoverAssetPath?: string | null;
  summary?: string | null;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
};

type DealActionBucket = Exclude<CardDistributionBucket, "unassigned">;

const actionMeta: Record<DealActionBucket, {
  icon: typeof ArrowLeft;
  label: string;
  shortcut: string;
}> = {
  alex: {
    icon: ArrowLeft,
    label: "Alex",
    shortcut: "Left"
  },
  max: {
    icon: ArrowRight,
    label: "Max",
    shortcut: "Right"
  },
  notApplicable: {
    icon: ArrowDown,
    label: "Not Applicable",
    shortcut: "Down"
  },
  savedForLater: {
    icon: ArrowUp,
    label: "Save for Later",
    shortcut: "Up"
  }
};

const boardOrder: CardBucket[] = [
  "alex",
  "max",
  "savedForLater",
  "notApplicable",
  "unassigned"
];

export function CardWorkspace({
  onDistribute,
  responsibilities,
  selectedPersona,
  view
}: CardWorkspaceProps) {
  if (view === "yourCards") {
    return (
      <YourCardsView
        responsibilities={responsibilities}
        selectedPersona={selectedPersona}
      />
    );
  }

  if (view === "board") {
    return (
      <BoardView
        onDistribute={onDistribute}
        responsibilities={responsibilities}
      />
    );
  }

  return (
    <DistributeView
      onDistribute={onDistribute}
      responsibilities={responsibilities}
    />
  );
}

function DistributeView({
  onDistribute,
  responsibilities
}: Pick<CardWorkspaceProps, "onDistribute" | "responsibilities">) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const allDeck = useMemo(
    () =>
      getDistributableCards(responsibilities).filter(
        (card) => !removedIds.has(card.id)
      ),
    [removedIds, responsibilities]
  );
  const deck = useMemo(() => searchCards(allDeck, query), [allDeck, query]);
  const topCard =
    deck.find((card) => card.id === selectedId) ?? deck[0] ?? null;
  const dragOffset = drag ? { x: drag.x - drag.startX, y: drag.y - drag.startY } : null;
  const previewBucket = dragOffset ? bucketFromOffset(dragOffset.x, dragOffset.y) : null;
  const hasSearch = query.trim().length > 0;

  async function distribute(bucket: DealActionBucket) {
    if (!topCard || pendingId) {
      return;
    }

    const card = topCard;
    setPendingId(card.id);
    setError(null);
    dragRef.current = null;
    setDrag(null);

    try {
      await onDistribute?.({
        bucket,
        responsibilityId: card.id
      });
      setLastAction(`${card.title} -> ${CARD_BUCKET_LABELS[bucket]}`);
      setRemovedIds((current) => new Set(current).add(card.id));
      setSelectedId((current) => (current === card.id ? null : current));
      setFlippedId((current) => (current === card.id ? null : current));
    } catch {
      setError("That card could not be moved. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!topCard || pendingId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const nextDrag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const nextDrag = { ...current, x: event.clientX, y: event.clientY };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const bucket = bucketFromOffset(current.x - current.startX, current.y - current.startY);
    dragRef.current = null;
    setDrag(null);

    if (bucket) {
      void distribute(bucket);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const bucketByKey: Partial<Record<string, DealActionBucket>> = {
      ArrowDown: "notApplicable",
      ArrowLeft: "alex",
      ArrowRight: "max",
      ArrowUp: "savedForLater"
    };
    const bucket = bucketByKey[event.key];

    if (bucket) {
      event.preventDefault();
      void distribute(bucket);
    }
  }

  return (
    <section className="grid min-h-[calc(100svh_-_var(--fp-app-content-bottom-padding))] gap-4">
      <header className="grid gap-2">
        <p className="text-[13px] font-bold text-fp-muted-ink">Deal</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Deal the next card
        </h1>
      </header>

      <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
        Search cards
        <span className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fp-muted-ink"
          />
          <input
            aria-label="Search cards to deal"
            className="min-h-12 w-full rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] py-3 pl-10 pr-3 text-[16px] font-semibold text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition focus:border-fp-ink"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, area, standard"
            type="search"
            value={query}
          />
        </span>
        <span className="text-[12px] font-bold text-fp-muted-ink">
          {hasSearch ? `${deck.length} match${deck.length === 1 ? "" : "es"}` : `${allDeck.length} cards waiting`}
        </span>
      </label>

      {topCard ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div
            aria-label="Responsibility deal deck"
            className="relative grid min-h-[28rem] place-items-center outline-none sm:min-h-[32rem]"
            data-testid="swipe-deck"
            onKeyDown={handleKeyDown}
            ref={deckRef}
            tabIndex={0}
          >
            <div aria-hidden className="absolute inset-x-8 top-10 h-[24rem] rounded-[8px] border border-fp-line bg-white/60 shadow-[var(--fp-shadow-soft)] rotate-[-3deg]" />
            <div aria-hidden className="absolute inset-x-6 top-8 h-[24rem] rounded-[8px] border border-fp-line bg-white/80 shadow-[var(--fp-shadow-soft)] rotate-[2deg]" />
            <SwipeCard
              card={topCard}
              flipped={flippedId === topCard.id}
              onFlip={() =>
                setFlippedId((current) => (current === topCard.id ? null : topCard.id))
              }
              onPointerCancel={handlePointerEnd}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              pending={pendingId === topCard.id}
              previewBucket={previewBucket}
              style={styleForDrag(dragOffset)}
            />
          </div>
          <AvailableCardList
            cards={deck}
            onSelect={(cardId) => {
              setSelectedId(cardId);
              setFlippedId(null);
            }}
            selectedId={topCard.id}
          />
        </div>
      ) : hasSearch && allDeck.length > 0 ? (
        <SearchEmptyState onClear={() => setQuery("")} />
      ) : (
        <EmptyDeck />
      )}

      <div className="grid gap-2" aria-label="Deal buttons">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["alex", "max", "savedForLater", "notApplicable"] as const).map(
            (bucket) => (
              <ActionButton
                bucket={bucket}
                disabled={!topCard || pendingId !== null}
                key={bucket}
                onClick={() => void distribute(bucket)}
              />
            )
          )}
        </div>
        <p className="text-center text-[12px] font-semibold text-fp-muted-ink">
          Arrow keys work too: left, right, up, down.
        </p>
        {lastAction ? (
          <p className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] font-bold text-fp-muted-ink" role="status">
            {lastAction}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-[8px] border border-fp-danger/40 bg-[var(--fp-surface-strong)] p-3 text-[13px] font-bold text-fp-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function YourCardsView({
  responsibilities,
  selectedPersona
}: Pick<CardWorkspaceProps, "responsibilities" | "selectedPersona">) {
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
      <header className="grid gap-2">
        <p className="text-[13px] font-bold text-fp-muted-ink">
          {selectedPersona.displayName}
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Your Deck
        </h1>
      </header>

      {cards.length > 0 ? (
        <>
          <div className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 shadow-[var(--fp-shadow-soft)]">
            <label className="grid gap-2 text-[13px] font-semibold text-fp-muted-ink">
              Search your deck
              <span className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fp-muted-ink"
                />
                <input
                  aria-label="Search your deck"
                  className="min-h-11 w-full rounded-[8px] border border-fp-line bg-white py-2.5 pl-10 pr-3 text-[16px] font-semibold text-fp-ink outline-none transition focus:border-fp-ink"
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
                  className={[
                    "min-h-10 rounded-[8px] border px-3 text-[13px] font-bold",
                    cadenceFilter === cadence
                      ? "border-fp-primary bg-fp-primary text-fp-on-primary"
                      : "border-fp-line bg-white text-fp-ink"
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
                  className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold text-fp-ink"
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

function BoardView({
  onDistribute,
  responsibilities
}: Pick<CardWorkspaceProps, "onDistribute" | "responsibilities">) {
  const groups = groupCardsByBucket(responsibilities);

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <p className="text-[13px] font-bold text-fp-muted-ink">Board</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Card board
        </h1>
      </header>

      <div
        className="grid max-w-full gap-3 md:grid-cols-2 xl:grid-cols-5"
        data-testid="card-board"
      >
        {boardOrder.map((bucket) => (
          <details
            open
            className={[
              "grid min-w-0 content-start gap-3 rounded-[8px] border p-3 shadow-[var(--fp-shadow-soft)] [&>summary::-webkit-details-marker]:hidden",
              CARD_BUCKET_TONES[bucket]
            ].join(" ")}
            key={bucket}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-[8px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]">
              <div>
                <h2 className="text-[16px] font-bold leading-6 text-fp-ink">
                  {CARD_BUCKET_LABELS[bucket]}
                </h2>
                <p className="text-[12px] font-semibold leading-5 text-fp-muted-ink">
                  {CARD_BUCKET_HELP[bucket]}
                </p>
              </div>
              <span className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 py-1 text-[12px] font-bold text-fp-ink">
                {groups[bucket].length}
              </span>
            </summary>
            <div className="mt-3 grid gap-2">
              {groups[bucket].map((card) => (
                <CompactCard
                  bucket={bucket}
                  card={card}
                  key={card.id}
                  onDistribute={onDistribute}
                />
              ))}
              {groups[bucket].length === 0 ? (
                <p className="min-h-24 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] font-semibold leading-5 text-fp-muted-ink">
                  Empty
                </p>
              ) : null}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function SwipeCard({
  card,
  flipped,
  onFlip,
  pending,
  previewBucket,
  style,
  ...handlers
}: {
  card: CardWorkspaceCard;
  flipped: boolean;
  onFlip: () => void;
  onPointerCancel: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLDivElement>) => void;
  pending: boolean;
  previewBucket: DealActionBucket | null;
  style?: CSSProperties;
}) {
  return (
    <article
      {...handlers}
      aria-label={card.title}
      aria-pressed={flipped}
      className="relative z-10 grid aspect-[5/7] w-[min(82vw,23rem)] touch-none select-none content-stretch overflow-hidden rounded-[8px] border border-fp-line bg-white text-left text-fp-ink shadow-[var(--fp-shadow-elevated)] transition-transform duration-150 will-change-transform"
      onClick={onFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onFlip();
        }
      }}
      role="button"
      style={style}
      tabIndex={0}
    >
      {flipped ? (
        <CardBack card={card} className="p-5" />
      ) : (
        <div className="grid grid-rows-[minmax(0,1fr)_auto]">
          <CardCoverImage card={card} className="min-h-0 bg-fp-surface p-3" />
          <div className="grid gap-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
                {card.cadence.replaceAll("_", " ")}
              </span>
              {card.areaKeys.slice(0, 1).map((area) => (
                <span
                  className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-3 py-1 text-[12px] font-bold text-fp-muted-ink"
                  key={area}
                >
                  {humanize(area)}
                </span>
              ))}
            </div>
            <div className="grid gap-1">
              <h2 className="text-[30px] font-bold leading-9 text-fp-ink [overflow-wrap:anywhere]">
                {card.title}
              </h2>
              <p className="text-[14px] font-semibold leading-6 text-fp-muted-ink">
                {card.areaKeys.map(humanize).slice(0, 3).join(" / ") || "Household"}
              </p>
            </div>
            <p className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-4 text-[14px] font-bold text-fp-ink">
              Tap to flip
            </p>
          </div>
        </div>
      )}

      {previewBucket ? (
        <div className="absolute inset-x-4 top-4 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 text-center text-[15px] font-bold text-fp-ink shadow-[var(--fp-shadow-soft)]">
          {CARD_BUCKET_LABELS[previewBucket]}
        </div>
      ) : null}
      {pending ? (
        <div className="absolute inset-0 grid place-items-center bg-white/80 text-[15px] font-bold text-fp-ink">
          Moving...
        </div>
      ) : null}
    </article>
  );
}

function CardFileItem({
  card
}: {
  card: CardWorkspaceCard;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article
      aria-label={card.title}
      aria-pressed={flipped}
      className="grid min-h-[20rem] overflow-hidden rounded-[8px] border border-fp-line bg-white text-left text-fp-ink shadow-[var(--fp-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--fp-shadow-elevated)]"
      onClick={() => setFlipped((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setFlipped((current) => !current);
        }
      }}
      role="button"
      tabIndex={0}
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
    </article>
  );
}

function CardBack({
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
        "grid content-start gap-3 bg-[var(--fp-surface-strong)]",
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
          <span className="rounded-full border border-fp-line bg-white px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
            Assigned to {assignmentLabelFor(card)}
          </span>
          <span className="rounded-full border border-fp-line bg-white px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
            {CARD_BUCKET_LABELS[bucket]}
          </span>
        </div>
      </header>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-white p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          What is this card for?
        </h3>
        <p className="line-clamp-5 text-[13px] leading-5 text-fp-muted-ink">
          {cardPurpose(card)}
        </p>
      </section>

      <section className="grid gap-1 rounded-[8px] border border-fp-line bg-white p-3">
        <h3 className="text-[13px] font-bold text-fp-ink">
          Fogging E-Standards
        </h3>
        <p className="line-clamp-5 text-[13px] leading-5 text-fp-muted-ink">
          {cardStandards(card)}
        </p>
      </section>
    </div>
  );
}

function CompactCard({
  bucket,
  card,
  onDistribute
}: {
  bucket: CardBucket;
  card: CardWorkspaceCard;
  onDistribute?: (move: CardDistributionMove) => Promise<void> | void;
}) {
  const moveBuckets = (["alex", "max", "savedForLater", "notApplicable"] as const).filter(
    (candidate) => candidate !== bucket
  );

  return (
    <article className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-2 shadow-sm">
      <Link
        className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3"
        href={`/app/responsibilities/${card.id}`}
      >
        <CardCoverImage
          card={card}
          className="aspect-[5/7] rounded-[8px] border border-fp-line bg-white p-1"
        />
        <span className="grid min-w-0 content-start gap-1">
          <span className="text-[14px] font-bold leading-5 text-fp-ink [overflow-wrap:anywhere]">
            {card.title}
          </span>
          <span className="text-[12px] font-semibold leading-4 text-fp-muted-ink">
            {card.cadence.replaceAll("_", " ")}
          </span>
        </span>
      </Link>
      {onDistribute ? (
        <div className="grid gap-2">
          {bucket !== "unassigned" ? (
            <button
              className="min-h-9 rounded-[8px] border border-fp-line bg-white px-2 text-[11px] font-bold text-fp-ink"
              onClick={() =>
                void onDistribute({
                  bucket: "unassigned",
                  responsibilityId: card.id
                })
              }
              type="button"
            >
              Remove from board
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-1">
            {moveBuckets.map((nextBucket) => (
              <button
                className="min-h-9 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-2 text-[11px] font-bold text-fp-ink"
                key={nextBucket}
                onClick={() =>
                  void onDistribute({
                    bucket: nextBucket,
                    responsibilityId: card.id
                  })
                }
                type="button"
              >
                {CARD_BUCKET_LABELS[nextBucket]}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function AvailableCardList({
  cards,
  onSelect,
  selectedId
}: {
  cards: CardWorkspaceCard[];
  onSelect: (cardId: string) => void;
  selectedId: string;
}) {
  return (
    <section
      aria-label="Available cards to deal"
      className="grid content-start gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 shadow-[var(--fp-shadow-soft)]"
      data-testid="distribution-card-list"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[16px] font-bold text-fp-ink">
          Available cards
        </h2>
        <span className="text-[12px] font-bold text-fp-muted-ink">
          {cards.length}
        </span>
      </div>
      <div className="grid max-h-[min(38rem,70svh)] gap-2 overflow-y-auto pr-1">
        {cards.map((card) => {
          const selected = card.id === selectedId;

          return (
            <button
              aria-pressed={selected}
              className={[
                "grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-[8px] border p-2 text-left outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
                selected
                  ? "border-fp-primary bg-white shadow-[var(--fp-shadow-soft)]"
                  : "border-fp-line bg-white/70"
              ].join(" ")}
              key={card.id}
              onClick={() => onSelect(card.id)}
              type="button"
            >
              <CardCoverImage
                card={card}
                className="aspect-[5/7] rounded-[8px] border border-fp-line bg-[var(--fp-surface)] p-1"
              />
              <span className="grid min-w-0 content-center gap-1">
                <span className="line-clamp-2 text-[13px] font-bold leading-5 text-fp-ink [overflow-wrap:anywhere]">
                  {card.title}
                </span>
                <span className="text-[11px] font-semibold text-fp-muted-ink">
                  {card.areaKeys.map(humanize).slice(0, 2).join(" / ") || "Household"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function CardCoverImage({
  card,
  className
}: {
  card: CardWorkspaceCard;
  className?: string;
}) {
  if (!card.sourceCoverAssetPath) {
    return (
      <div
        aria-label={`${card.title} cover`}
        className={[
          "grid place-items-center overflow-hidden text-center text-[12px] font-bold text-fp-muted-ink",
          className ?? ""
        ].join(" ")}
        role="img"
      >
        <span className="px-2">Card cover</span>
      </div>
    );
  }

  return (
    <div className={["overflow-hidden", className ?? ""].join(" ")}>
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

function ActionButton({
  bucket,
  disabled,
  onClick
}: {
  bucket: DealActionBucket;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = actionMeta[bucket].icon;

  return (
    <button
      aria-label={actionMeta[bucket].label}
      className="grid min-h-14 place-items-center gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[13px] font-bold text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55"
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <Icon aria-hidden className="h-4 w-4" />
      <span>{actionMeta[bucket].label}</span>
      <span aria-hidden className="text-[11px] text-fp-muted-ink">
        {actionMeta[bucket].shortcut}
      </span>
    </button>
  );
}

function SearchEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <section className="grid min-h-[24rem] place-items-center rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-6 text-center shadow-[var(--fp-shadow-soft)]">
      <div className="grid justify-items-center gap-3">
        <Search aria-hidden className="h-10 w-10 text-fp-muted-ink" />
        <h2 className="max-w-sm text-[22px] font-bold leading-7 text-fp-ink">
          No cards match this search.
        </h2>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-white px-4 text-[14px] font-bold text-fp-ink"
          onClick={onClear}
          type="button"
        >
          Clear search
        </button>
      </div>
    </section>
  );
}

function EmptyDeck() {
  return (
    <section className="grid min-h-[24rem] place-items-center rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-6 text-center shadow-[var(--fp-shadow-soft)]">
      <div className="grid justify-items-center gap-3">
        <Sparkles aria-hidden className="h-10 w-10 text-[var(--fp-helper)]" />
        <h2 className="max-w-sm text-[22px] font-bold leading-7 text-fp-ink">
          No more cards to deal. Generate more cards when ready.
        </h2>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary"
          href="/app/ask-greg"
        >
          Ask Greg
        </Link>
      </div>
    </section>
  );
}

function bucketFromOffset(
  offsetX: number,
  offsetY: number
): DealActionBucket | null {
  const threshold = 88;

  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    return null;
  }

  if (Math.max(Math.abs(offsetX), Math.abs(offsetY)) < threshold) {
    return null;
  }

  if (Math.abs(offsetX) > Math.abs(offsetY)) {
    return offsetX < 0 ? "alex" : "max";
  }

  return offsetY < 0 ? "savedForLater" : "notApplicable";
}

function styleForDrag(offset: { x: number; y: number } | null): CSSProperties {
  if (!offset) {
    return {};
  }

  const rotate = Math.max(-12, Math.min(12, offset.x / 18));

  return {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotate}deg)`
  };
}

function searchCards<T extends CardWorkspaceCard>(cards: readonly T[], query: string): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [...cards];
  }

  return cards.filter((card) =>
    [
      card.title,
      card.summary,
      card.sourceDefinition,
      card.householdStandard,
      card.sourceMinimumStandard,
      card.cadence,
      ...card.areaKeys,
      ...card.hiddenEffortKeys
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedQuery)
  );
}

function assignmentLabelFor(card: CardWorkspaceCard) {
  const owners = card.currentAssignments.filter(
    (assignment) =>
      assignment.role === "accountable_owner" || assignment.role === "shared_owner"
  );

  if (owners.length > 0) {
    return owners.map((assignment) => humanize(assignment.personaKey)).join(" + ");
  }

  return CARD_BUCKET_LABELS[bucketForCard(card)];
}

function cardPurpose(card: CardWorkspaceCard) {
  return (
    card.sourceDefinition ??
    card.summary ??
    `A ${card.areaKeys.map(humanize).join(", ") || "household"} responsibility.`
  );
}

function cardStandards(card: CardWorkspaceCard) {
  return (
    card.sourceMinimumStandard ??
    card.householdStandard ??
    "No standard has been written for this card yet."
  );
}

function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
