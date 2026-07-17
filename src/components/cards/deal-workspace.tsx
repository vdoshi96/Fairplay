"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Search,
  Sparkles
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";

import { HouseholdWorkMapSummary } from "./household-work-map-summary";
import {
  CARD_BUCKET_LABELS,
  getDistributableCards
} from "./card-state";
import { CardBack } from "./card-back";
import { CardCoverImage } from "./card-cover-image";
import { humanize, searchCards } from "./card-workspace-helpers";
import type {
  CardWorkspaceCard,
  DealWorkspaceProps
} from "./card-workspace-types";
import {
  DEAL_EXIT_DURATION_MS,
  bucketFromOffset,
  styleForDealExit,
  styleForDrag,
  touchDealIntent,
  type DealActionBucket
} from "./deal-transitions";

type DragState = {
  dragging: boolean;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
};

type LastDealAction = {
  bucket: DealActionBucket;
  card: CardWorkspaceCard;
};

type OutgoingDealCard = {
  bucket: DealActionBucket;
  card: CardWorkspaceCard;
  exiting: boolean;
  flipped: boolean;
};

const actionMeta: Record<
  DealActionBucket,
  {
    icon: typeof ArrowLeft;
    label: string;
    shortcut: string;
  }
> = {
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

const AVAILABLE_CARD_WINDOW_SIZE = 20;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_CARD_BROWSER_QUERY = "(min-width: 1024px)";

export function DealWorkspace({
  addedToDeal,
  initialSelectedId,
  onDistribute,
  responsibilities,
  workMap
}: DealWorkspaceProps) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [outgoingCard, setOutgoingCard] = useState<OutgoingDealCard | null>(null);
  const [lastAction, setLastAction] = useState<LastDealAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAddedStatus, setShowAddedStatus] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => initialSelectedId ?? null
  );
  const dragRef = useRef<DragState | null>(null);
  const deckRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);
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
  const dragOffset =
    drag?.dragging ? { x: drag.x - drag.startX, y: drag.y - drag.startY } : null;
  const previewBucket = dragOffset ? bucketFromOffset(dragOffset.x, dragOffset.y) : null;
  const hasSearch = query.trim().length > 0;
  const addedCard = showAddedStatus && topCard?.id === initialSelectedId
    ? allDeck.find((card) => card.id === initialSelectedId) ?? null
    : null;
  const outgoingCardId = outgoingCard?.card.id ?? null;

  useEffect(() => {
    if (!outgoingCardId) {
      return undefined;
    }

    if (prefersReducedMotion) {
      setOutgoingCard(null);
      return undefined;
    }

    setOutgoingCard((current) =>
      current ? { ...current, exiting: true } : current
    );
    const timeout = window.setTimeout(() => {
      setOutgoingCard(null);
    }, DEAL_EXIT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [outgoingCardId, prefersReducedMotion]);

  useEffect(() => {
    if (!addedToDeal) {
      return;
    }

    // Insert the live region after hydration so assistive technology announces
    // the navigation result instead of treating it as initial page content.
    setShowAddedStatus(true);
    window.history.replaceState(window.history.state, "", "/app/distribute");
  }, [addedToDeal]);

  async function distribute(bucket: DealActionBucket) {
    if (!topCard || pendingId) {
      return;
    }

    const card = topCard;
    const cardIndex = deck.findIndex((candidate) => candidate.id === card.id);
    const nextCard =
      deck.length > 1
        ? deck[(cardIndex + 1 + deck.length) % deck.length] ?? null
        : null;
    const wasFlipped = flippedId === card.id;
    setShowAddedStatus(false);
    setPendingId(card.id);
    setError(null);
    dragRef.current = null;
    setDrag(null);
    setRemovedIds((current) => new Set(current).add(card.id));
    setSelectedId(nextCard?.id ?? null);
    setFlippedId((current) => (current === card.id ? null : current));
    setOutgoingCard(
      prefersReducedMotion
        ? null
        : {
            bucket,
            card,
            exiting: false,
            flipped: wasFlipped
          }
    );

    try {
      await onDistribute?.({
        bucket,
        responsibilityId: card.id
      });
      setLastAction({ bucket, card });
    } catch {
      setOutgoingCard(null);
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      setSelectedId(card.id);
      setFlippedId(wasFlipped ? card.id : null);
      setError(`${card.title} could not be moved. It is back in the same place.`);
    } finally {
      setPendingId(null);
    }
  }

  async function undoLastAction() {
    if (!lastAction || pendingId) {
      return;
    }

    const card = lastAction.card;
    setPendingId(card.id);
    setError(null);
    setOutgoingCard(null);

    try {
      await onDistribute?.({
        bucket: "unassigned",
        responsibilityId: card.id
      });
      setRemovedIds((current) => {
        const next = new Set(current);
        next.delete(card.id);
        return next;
      });
      setSelectedId(card.id);
      setFlippedId(null);
      setLastAction(null);
    } catch {
      setError("That undo could not be saved. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!topCard || pendingId) {
      return;
    }

    event.stopPropagation();
    const pointerType = event.pointerType || "mouse";
    const isTouch = pointerType === "touch";

    if (!isTouch) {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    const nextDrag = {
      dragging: !isTouch,
      pointerId: event.pointerId,
      pointerType,
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

    const offsetX = event.clientX - current.startX;
    const offsetY = event.clientY - current.startY;
    const isTouch = current.pointerType === "touch";
    let isDragging = current.dragging;

    if (isTouch && !isDragging) {
      const intent = touchDealIntent(offsetX, offsetY);

      if (intent === "scroll") {
        dragRef.current = null;
        setDrag(null);
        return;
      }

      if (intent === "pending") {
        const nextPending = { ...current, x: event.clientX, y: event.clientY };
        dragRef.current = nextPending;
        setDrag(nextPending);
        return;
      }

      isDragging = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }

    if (isDragging) {
      event.preventDefault();
      event.stopPropagation();
    }

    const nextDrag = {
      ...current,
      dragging: isDragging,
      x: event.clientX,
      y: event.clientY
    };
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    const bucket = current.dragging
      ? bucketFromOffset(current.x - current.startX, current.y - current.startY)
      : null;
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
        <p className="text-[13px] font-bold text-fp-primary">Deal</p>
        <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink sm:text-[36px] sm:leading-[42px]">
          Deal the next card
        </h1>
      </header>

      <p aria-atomic="true" className="sr-only" role="status">
        {addedCard
          ? `${addedCard.title} was added to Deal and selected.`
          : ""}
      </p>

      {addedCard ? (
        <p className="rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-3 text-[14px] font-semibold text-fp-ink shadow-[var(--fp-shadow-soft)]">
          {addedCard.title} was added to Deal and selected.
        </p>
      ) : null}

      {workMap ? (
        <HouseholdWorkMapSummary variant="deal" workMap={workMap} />
      ) : null}

      <label className="fp-panel grid gap-2 p-3 text-[13px] font-bold text-fp-muted-ink sm:p-4">
        Search cards
        <span className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fp-muted-ink"
          />
          <input
            aria-label="Search cards to deal"
            className="fp-input w-full py-3 pl-10 pr-3 text-[16px] font-semibold disabled:cursor-wait disabled:opacity-60"
            disabled={pendingId !== null}
            onChange={(event) => {
              if (pendingId) {
                return;
              }

              setQuery(event.target.value);
              setShowAddedStatus(false);
            }}
            placeholder="Search by title, area, standard"
            type="search"
            value={query}
          />
        </span>
        <span className="text-[12px] font-bold text-fp-muted-ink">
          {hasSearch ? `${deck.length} match${deck.length === 1 ? "" : "es"}` : `${allDeck.length} cards waiting`}
        </span>
      </label>

      {topCard || outgoingCard ? <DealGestureInstructions /> : null}

      {topCard || outgoingCard ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div
            aria-label="Responsibility deal deck"
            className="relative grid min-h-[28rem] place-items-center rounded-[8px] border border-fp-line bg-[color:var(--fp-surface)]/55 p-3 shadow-[var(--fp-shadow-soft)] outline-none sm:min-h-[32rem]"
            data-testid="swipe-deck"
            onKeyDown={handleKeyDown}
            ref={deckRef}
            tabIndex={0}
          >
            <div aria-hidden className="absolute inset-x-8 top-10 h-[24rem] rounded-[8px] border border-fp-line bg-[var(--fp-card-muted)] shadow-[var(--fp-shadow-soft)] rotate-[-3deg]" />
            <div aria-hidden className="absolute inset-x-6 top-8 h-[24rem] rounded-[8px] border border-fp-line bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)] rotate-[2deg]" />
            {topCard ? (
              <SwipeCard
                card={topCard}
                flipped={flippedId === topCard.id}
                onFlip={() =>
                  setFlippedId((current) =>
                    current === topCard.id ? null : topCard.id
                  )
                }
                onPointerCancel={handlePointerEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                pending={false}
                previewBucket={previewBucket}
                style={styleForDrag(dragOffset)}
              />
            ) : null}
            {outgoingCard ? (
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 z-20 grid place-items-center p-3"
                data-direction={outgoingCard.bucket}
                data-testid="deal-outgoing-card"
                style={styleForDealExit(outgoingCard)}
              >
                <SwipeCard
                  card={outgoingCard.card}
                  decorative
                  flipped={outgoingCard.flipped}
                  onFlip={() => undefined}
                  onPointerCancel={() => undefined}
                  onPointerDown={() => undefined}
                  onPointerMove={() => undefined}
                  onPointerUp={() => undefined}
                  pending
                  previewBucket={outgoingCard.bucket}
                />
              </div>
            ) : null}
          </div>
          <AvailableCardList
            cards={deck}
            interactionDisabled={pendingId !== null}
            onSelect={(cardId) => {
              if (pendingId) {
                return;
              }

              setSelectedId(cardId);
              setFlippedId(null);
              setShowAddedStatus(false);
            }}
            selectedId={topCard?.id ?? null}
          />
        </div>
      ) : hasSearch && allDeck.length > 0 ? (
        <SearchEmptyState
          onClear={() => {
            setQuery("");
            setShowAddedStatus(false);
          }}
        />
      ) : (
        <EmptyDeck />
      )}

      <div className="grid gap-2" aria-label="Deal buttons">
        <p aria-live="polite" className="sr-only">
          {pendingId
            ? `Moving ${responsibilities.find((card) => card.id === pendingId)?.title ?? "card"}. The next card is ready.`
            : ""}
        </p>
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
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] font-bold text-fp-muted-ink"
            role="status"
          >
            <span>
              {lastAction.card.title} -&gt; {CARD_BUCKET_LABELS[lastAction.bucket]}
            </span>
            <button
              className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingId !== null}
              onClick={() => void undoLastAction()}
              type="button"
            >
              Undo last assignment
            </button>
          </div>
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

function SwipeCard({
  card,
  decorative = false,
  flipped,
  onFlip,
  pending,
  previewBucket,
  style,
  ...handlers
}: {
  card: CardWorkspaceCard;
  decorative?: boolean;
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
      {...(decorative ? {} : handlers)}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : card.title}
      aria-pressed={decorative ? undefined : flipped}
      className="relative z-10 grid aspect-[5/7] w-[min(82vw,23rem)] touch-pan-y select-none content-stretch overflow-hidden rounded-[8px] border border-fp-line bg-[var(--fp-card)] text-left text-fp-ink shadow-[var(--fp-shadow-elevated)] transition-transform duration-150 will-change-transform"
      onClick={decorative ? undefined : onFlip}
      onKeyDown={
        decorative
          ? undefined
          : (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onFlip();
              }
            }
      }
      role={decorative ? undefined : "button"}
      style={style}
      tabIndex={decorative ? -1 : 0}
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
        <div className="absolute inset-0 grid place-items-center bg-[color:var(--fp-card)]/80 text-[15px] font-bold text-fp-ink">
          Moving...
        </div>
      ) : null}
    </article>
  );
}

function DealGestureInstructions() {
  const instructions = [
    "Swipe left: Alex",
    "Swipe right: Max",
    "Swipe up: Save for later",
    "Swipe down: Not applicable"
  ];

  return (
    <ul
      aria-label="Deal gesture instructions"
    className="grid grid-cols-2 gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-3 text-[12px] font-bold leading-5 text-fp-muted-ink shadow-[var(--fp-shadow-soft)] sm:grid-cols-4"
    >
      {instructions.map((instruction) => (
        <li key={instruction}>{instruction}</li>
      ))}
    </ul>
  );
}

function AvailableCardList({
  cards,
  interactionDisabled,
  onSelect,
  selectedId
}: {
  cards: CardWorkspaceCard[];
  interactionDisabled: boolean;
  onSelect: (cardId: string) => void;
  selectedId: string | null;
}) {
  const isDesktop = useMediaQuery(DESKTOP_CARD_BROWSER_QUERY);
  const [expanded, setExpanded] = useState(false);
  const [windowStart, setWindowStart] = useState(0);
  const previousDesktop = useRef<boolean | null>(null);

  useEffect(() => {
    if (previousDesktop.current !== isDesktop) {
      setExpanded(isDesktop);
      previousDesktop.current = isDesktop;
    }
  }, [isDesktop]);

  useEffect(() => {
    const selectedIndex = selectedId
      ? cards.findIndex((card) => card.id === selectedId)
      : -1;
    const lastWindowStart = Math.max(
      0,
      Math.floor(Math.max(0, cards.length - 1) / AVAILABLE_CARD_WINDOW_SIZE) *
        AVAILABLE_CARD_WINDOW_SIZE
    );

    if (selectedIndex >= 0) {
      setWindowStart(
        Math.floor(selectedIndex / AVAILABLE_CARD_WINDOW_SIZE) *
          AVAILABLE_CARD_WINDOW_SIZE
      );
    } else {
      setWindowStart((current) => Math.min(current, lastWindowStart));
    }
  }, [cards, selectedId]);

  const visibleCards = cards.slice(
    windowStart,
    windowStart + AVAILABLE_CARD_WINDOW_SIZE
  );
  const windowEnd = Math.min(cards.length, windowStart + AVAILABLE_CARD_WINDOW_SIZE);

  return (
    <section
      aria-label="Available cards to deal"
      className="grid content-start gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-3 shadow-[var(--fp-shadow-soft)]"
      data-testid="distribution-card-list"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[16px] font-bold text-fp-ink">
          Available cards
        </h2>
        <button
          aria-controls="available-card-window"
          aria-expanded={expanded}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink disabled:cursor-wait disabled:opacity-60"
          disabled={interactionDisabled}
          onClick={() => {
            if (!interactionDisabled) {
              setExpanded((current) => !current);
            }
          }}
          type="button"
        >
          {expanded ? "Hide" : "Show"} {cards.length}
          <ChevronDown
            aria-hidden
            className={[
              "h-4 w-4 transition-transform",
              expanded ? "rotate-180" : ""
            ].join(" ")}
          />
        </button>
      </div>
      {expanded ? (
        <div className="grid gap-2" id="available-card-window">
          <p className="text-[12px] font-bold text-fp-muted-ink">
            Showing {cards.length === 0 ? 0 : windowStart + 1}-{windowEnd} of {cards.length}
          </p>
          <div className="grid max-h-[min(38rem,70svh)] gap-2 overflow-y-auto pr-1">
            {visibleCards.map((card) => {
              const selected = card.id === selectedId;

              return (
                <button
                  aria-pressed={selected}
                  className={[
                    "grid min-h-11 min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-[8px] border p-2 text-left outline-none transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
                    selected
                      ? "border-fp-primary bg-[var(--fp-card)] shadow-[var(--fp-shadow-soft)]"
                      : "border-fp-line bg-[var(--fp-surface)]"
                  ].join(" ")}
                  data-testid="available-card-row"
                  disabled={interactionDisabled}
                  key={card.id}
                  onClick={() => {
                    if (!interactionDisabled) {
                      onSelect(card.id);
                    }
                  }}
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
          {cards.length > AVAILABLE_CARD_WINDOW_SIZE ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink disabled:opacity-50"
                disabled={interactionDisabled || windowStart === 0}
                onClick={() =>
                  setWindowStart((current) =>
                    Math.max(0, current - AVAILABLE_CARD_WINDOW_SIZE)
                  )
                }
                type="button"
              >
                Previous cards
              </button>
              <button
                className="min-h-11 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink disabled:opacity-50"
                disabled={interactionDisabled || windowEnd >= cards.length}
                onClick={() =>
                  setWindowStart((current) =>
                    Math.min(
                      current + AVAILABLE_CARD_WINDOW_SIZE,
                      Math.max(0, cards.length - 1)
                    )
                  )
                }
                type="button"
              >
                Next cards
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
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
      className="grid min-h-14 place-items-center gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-card)] px-3 py-2 text-[13px] font-bold text-fp-ink shadow-[var(--fp-shadow-soft)] outline-none transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)] disabled:cursor-not-allowed disabled:opacity-55"
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
    <section className="grid min-h-[24rem] place-items-center rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-card)] p-6 text-center shadow-[var(--fp-shadow-soft)]">
      <div className="grid justify-items-center gap-3">
        <Search aria-hidden className="h-10 w-10 text-fp-muted-ink" />
        <h2 className="max-w-sm text-[22px] font-bold leading-7 text-fp-ink">
          No cards match this search.
        </h2>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-4 text-[14px] font-bold text-fp-ink"
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
    <section className="grid min-h-[24rem] place-items-center rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-card)] p-6 text-center shadow-[var(--fp-shadow-soft)]">
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

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return undefined;
    }

    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [query]);

  return matches;
}
