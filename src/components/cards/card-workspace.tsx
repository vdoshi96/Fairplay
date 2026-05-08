"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Archive,
  CheckCircle2,
  MoreHorizontal,
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
  bucketForLane,
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
  summary?: string | null;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
};

const actionMeta: Record<CardDistributionBucket, {
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
  const deckRef = useRef<HTMLDivElement | null>(null);
  const allDeck = useMemo(
    () =>
      getDistributableCards(responsibilities).filter(
        (card) => !removedIds.has(card.id)
      ),
    [removedIds, responsibilities]
  );
  const deck = useMemo(() => searchCards(allDeck, query), [allDeck, query]);
  const topCard = deck[0] ?? null;
  const dragOffset = drag ? { x: drag.x - drag.startX, y: drag.y - drag.startY } : null;
  const previewBucket = dragOffset ? bucketFromOffset(dragOffset.x, dragOffset.y) : null;
  const hasSearch = query.trim().length > 0;

  async function distribute(bucket: CardDistributionBucket) {
    if (!topCard || pendingId) {
      return;
    }

    const card = topCard;
    setPendingId(card.id);
    setError(null);
    setLastAction(`${card.title} -> ${CARD_BUCKET_LABELS[bucket]}`);
    setRemovedIds((current) => new Set(current).add(card.id));
    setDrag(null);
    setFlippedId(null);

    try {
      await onDistribute?.({
        bucket,
        responsibilityId: card.id
      });
    } catch {
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      setError("That card could not be moved. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!topCard || pendingId) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: event.clientX,
      y: event.clientY
    });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    setDrag((current) =>
      current?.pointerId === event.pointerId
        ? { ...current, x: event.clientX, y: event.clientY }
        : current
    );
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const bucket = bucketFromOffset(event.clientX - drag.startX, event.clientY - drag.startY);
    setDrag(null);

    if (bucket) {
      void distribute(bucket);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const bucketByKey: Partial<Record<string, CardDistributionBucket>> = {
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
        <p className="text-[13px] font-bold text-fp-muted-ink">Distribute</p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Swipe the next card
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
            aria-label="Search cards to distribute"
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
        <div
          aria-label="Responsibility swipe deck"
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
      ) : hasSearch && allDeck.length > 0 ? (
        <SearchEmptyState onClear={() => setQuery("")} />
      ) : (
        <EmptyDeck />
      )}

      <div className="grid gap-2" aria-label="Distribution buttons">
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
  const cards = getCardsForPersona(responsibilities, selectedPersona.key);

  return (
    <section className="grid gap-4">
      <header className="grid gap-2">
        <p className="text-[13px] font-bold text-fp-muted-ink">
          {selectedPersona.displayName}
        </p>
        <h1 className="text-[28px] font-bold leading-[34px] text-fp-ink">
          Your Cards
        </h1>
      </header>

      {cards.length > 0 ? (
        <div
          className="grid max-h-[calc(100svh_-_12rem)] gap-3 overflow-y-auto pr-1"
          data-testid="your-card-file"
        >
          {cards.map((card, index) => (
            <CardFileItem card={card} index={index} key={card.id} />
          ))}
        </div>
      ) : (
        <section className="grid gap-3 rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] p-5 text-center shadow-[var(--fp-shadow-soft)]">
          <Archive aria-hidden className="mx-auto h-9 w-9 text-fp-muted-ink" />
          <h2 className="text-[18px] font-bold text-fp-ink">
            No cards assigned to you yet.
          </h2>
          <Link
            className="mx-auto inline-flex min-h-11 items-center justify-center rounded-[8px] bg-fp-primary px-4 text-[14px] font-bold text-fp-on-primary"
            href="/app/distribute"
          >
            Distribute cards
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
        className="grid max-w-full gap-3 overflow-x-auto pb-2 lg:grid-cols-5 lg:overflow-visible"
        data-testid="card-board"
      >
        {boardOrder.map((bucket) => (
          <section
            className={[
              "grid min-w-[17rem] content-start gap-3 rounded-[8px] border p-3 shadow-[var(--fp-shadow-soft)] lg:min-w-0",
              CARD_BUCKET_TONES[bucket]
            ].join(" ")}
            key={bucket}
          >
            <div className="flex items-start justify-between gap-3">
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
            </div>
            <div className="grid gap-2">
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
          </section>
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
  previewBucket: CardDistributionBucket | null;
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
        <div className="grid content-between gap-3 p-5">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-fp-line bg-[var(--fp-surface)] px-3 py-1 text-[12px] font-bold text-fp-muted-ink">
                {card.cadence.replaceAll("_", " ")}
              </span>
              <MoreHorizontal aria-hidden className="h-5 w-5 text-fp-muted-ink" />
            </div>
            <div className="grid gap-2">
              <h2 className="text-[30px] font-bold leading-9 text-fp-ink [overflow-wrap:anywhere]">
                {card.title}
              </h2>
              <p className="text-[14px] font-semibold leading-6 text-fp-muted-ink">
                {card.areaKeys.map(humanize).slice(0, 3).join(" / ") || "Household"}
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              {card.hiddenEffortKeys.slice(0, 4).map((key) => (
                <span
                  className="rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-2 py-2 text-[12px] font-bold text-fp-muted-ink"
                  key={key}
                >
                  {humanize(key)}
                </span>
              ))}
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
  card,
  index
}: {
  card: CardWorkspaceCard;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <article
      aria-label={card.title}
      aria-pressed={flipped}
      className="grid min-h-[13.5rem] gap-3 rounded-[8px] border border-fp-line bg-white text-left text-fp-ink shadow-[var(--fp-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--fp-shadow-elevated)]"
      onClick={() => setFlipped((current) => !current)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setFlipped((current) => !current);
        }
      }}
      role="button"
      style={{
        marginLeft: `${(index % 3) * 8}px`
      }}
      tabIndex={0}
    >
      {flipped ? (
        <CardBack card={card} className="p-4" />
      ) : (
        <div className="grid content-between gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-[21px] font-bold leading-7 [overflow-wrap:anywhere]">
              {card.title}
            </h2>
            <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-[var(--fp-alex)]" />
          </div>
          <p className="text-[13px] font-semibold leading-5 text-fp-muted-ink">
            {card.areaKeys.map(humanize).slice(0, 3).join(" / ") || "Household"}
          </p>
          <p className="text-[13px] leading-5 text-fp-muted-ink">
            {card.hiddenEffortKeys.map(humanize).slice(0, 3).join(", ")}
          </p>
          <p className="text-[12px] font-bold text-fp-muted-ink">Tap to flip</p>
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
  const lane = bucketForLane(card.boardLane);

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
            {CARD_BUCKET_LABELS[lane]}
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
    <article className="grid gap-3 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 shadow-sm">
      <Link className="grid gap-1" href={`/app/responsibilities/${card.id}`}>
        <h3 className="text-[14px] font-bold leading-5 text-fp-ink [overflow-wrap:anywhere]">
          {card.title}
        </h3>
        <p className="text-[12px] font-semibold leading-4 text-fp-muted-ink">
          {card.cadence.replaceAll("_", " ")}
        </p>
      </Link>
      {onDistribute ? (
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
      ) : null}
    </article>
  );
}

function ActionButton({
  bucket,
  disabled,
  onClick
}: {
  bucket: CardDistributionBucket;
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
          No more cards to distribute. Generate more cards when ready.
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
): CardDistributionBucket | null {
  const threshold = 88;

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

  return CARD_BUCKET_LABELS[bucketForLane(card.boardLane)];
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
