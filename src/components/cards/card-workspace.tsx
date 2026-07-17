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
  ChevronDown,
  Search,
  Sparkles,
  Undo2
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent
} from "react";

import type { HouseholdWorkMap } from "@/contracts/household-work-map";
import type { PersonaSummary } from "@/contracts/personas";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import { HouseholdWorkMapSummary } from "./household-work-map-summary";
import type { CardBucket, CardDistributionBucket, CardDistributionMove } from "./card-state";
import {
  CARD_BUCKET_HELP,
  CARD_BUCKET_LABELS,
  CARD_BUCKET_TONES,
  bucketForCard,
  getCardsForPersona,
  getDistributableCards,
  getSharedOwnerCards,
  groupCardsByBucket
} from "./card-state";

type CardWorkspaceProps = {
  addedToDeal?: boolean;
  initialSelectedId?: string;
  onDistribute?: (move: CardDistributionMove) => Promise<void> | void;
  responsibilities: CardWorkspaceCard[];
  selectedPersona: PersonaSummary;
  view: "board" | "distribute" | "yourCards";
  workMap?: HouseholdWorkMap;
};

type CardWorkspaceCard = ResponsibilitySummary & {
  householdStandard?: string | null;
  sourceDefinition?: string | null;
  sourceMinimumStandard?: string | null;
  sourceCoverAssetPath?: string | null;
  summary?: string | null;
};

type DragState = {
  dragging: boolean;
  pointerId: number;
  pointerType: string;
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

type LastBoardMove = {
  card: CardWorkspaceCard;
  fromBucket: PersistedBoardSection;
  toBucket: CardDistributionBucket;
};

const TOUCH_SCROLL_DISTANCE_PX = 12;
const TOUCH_DRAG_LOCK_DISTANCE_PX = 18;
const HORIZONTAL_SWIPE_DISTANCE_PX = 112;
const VERTICAL_SWIPE_DISTANCE_PX = 176;
const HORIZONTAL_DOMINANCE_RATIO = 1.25;
const VERTICAL_DOMINANCE_RATIO = 1.45;
const DEAL_EXIT_DURATION_MS = 200;
const AVAILABLE_CARD_WINDOW_SIZE = 20;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DESKTOP_CARD_BROWSER_QUERY = "(min-width: 1024px)";

export function CardWorkspace({
  addedToDeal = false,
  initialSelectedId,
  onDistribute,
  responsibilities,
  selectedPersona,
  view,
  workMap
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
        workMap={workMap}
      />
    );
  }

  return (
    <DistributeView
      addedToDeal={addedToDeal}
      initialSelectedId={initialSelectedId}
      onDistribute={onDistribute}
      responsibilities={responsibilities}
      workMap={workMap}
    />
  );
}

function DistributeView({
  addedToDeal,
  initialSelectedId,
  onDistribute,
  responsibilities,
  workMap
}: Pick<
  CardWorkspaceProps,
  | "addedToDeal"
  | "initialSelectedId"
  | "onDistribute"
  | "responsibilities"
  | "workMap"
>) {
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

function BoardView({
  onDistribute,
  responsibilities,
  workMap
}: Pick<CardWorkspaceProps, "onDistribute" | "responsibilities" | "workMap">) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [cardError, setCardError] = useState<{
    cardId: string;
    message: string;
  } | null>(null);
  const [lastMove, setLastMove] = useState<LastBoardMove | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const undoButtonRef = useRef<HTMLButtonElement | null>(null);
  const undoStatusRef = useRef<HTMLDivElement | null>(null);
  const groups = groupCardsByBucket(responsibilities);
  const sharedCards = getSharedOwnerCards(responsibilities);
  const sharedCardIds = new Set(sharedCards.map((card) => card.id));
  const primarySections: PersistedBoardSection[] = ["alex", "max"];
  const secondarySections: PersistedBoardSection[] = [
    "savedForLater",
    "notApplicable"
  ];

  useEffect(() => {
    if (pendingId !== null) {
      return;
    }

    if (lastMove) {
      undoButtonRef.current?.focus();
    } else if (undoMessage) {
      undoStatusRef.current?.focus();
    }
  }, [lastMove, pendingId, undoMessage]);

  async function moveCard(
    card: CardWorkspaceCard,
    fromBucket: PersistedBoardSection,
    toBucket: CardDistributionBucket
  ) {
    if (!onDistribute || pendingId) {
      return;
    }

    setPendingId(card.id);
    setCardError(null);
    setUndoMessage(null);

    try {
      await onDistribute({
        bucket: toBucket,
        responsibilityId: card.id
      });
      setLastMove({ card, fromBucket, toBucket });
    } catch {
      setCardError({
        cardId: card.id,
        message: `${card.title} could not be moved. Nothing changed.`
      });
    } finally {
      setPendingId(null);
    }
  }

  async function undoLastMove() {
    if (!lastMove || !onDistribute || pendingId) {
      return;
    }

    setPendingId(lastMove.card.id);
    setCardError(null);

    try {
      await onDistribute({
        bucket: lastMove.fromBucket,
        responsibilityId: lastMove.card.id
      });
      setUndoMessage(
        `${lastMove.card.title} restored to ${CARD_BUCKET_LABELS[lastMove.fromBucket]}.`
      );
      setLastMove(null);
    } catch {
      setCardError({
        cardId: lastMove.card.id,
        message: `${lastMove.card.title} could not be restored. Try Undo again.`
      });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="grid gap-3 lg:gap-4">
      <header className="grid gap-1">
        <p className="text-[13px] font-bold text-fp-primary">Board</p>
        <h1 className="text-[32px] font-bold leading-[38px] text-fp-ink sm:text-[36px] sm:leading-[42px]">
          Card board
        </h1>
        <p className="max-w-2xl text-[14px] font-semibold leading-6 text-fp-muted-ink">
          Organize assigned cards by person or status.
        </p>
      </header>

      {workMap ? (
        <HouseholdWorkMapSummary variant="board" workMap={workMap} />
      ) : null}

      <div
        className="grid max-w-full gap-3"
        data-testid="card-board"
      >
        <BoardLane
          cardError={cardError}
          cards={sharedCards}
          onMove={onDistribute ? moveCard : undefined}
          pendingId={pendingId}
          priority="shared"
          section="shared"
        />
        <div
          className="grid max-w-full gap-3 xl:grid-cols-[minmax(0,1fr)_17rem] xl:items-start"
        >
          <div
            className="grid min-w-0 gap-3 lg:grid-cols-2"
            data-testid="primary-board-lanes"
          >
            {primarySections.map((section) => (
              <BoardLane
                cardError={cardError}
                cards={groups[section].filter(
                  (card) => !sharedCardIds.has(card.id)
                )}
                key={section}
                onMove={onDistribute ? moveCard : undefined}
                pendingId={pendingId}
                priority="primary"
                section={section}
              />
            ))}
          </div>
          <div
            className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-1"
            data-testid="secondary-board-lanes"
          >
            {secondarySections.map((section) => (
              <BoardLane
                cardError={cardError}
                cards={groups[section]}
                key={section}
                onMove={onDistribute ? moveCard : undefined}
                pendingId={pendingId}
                priority="secondary"
                section={section}
              />
            ))}
          </div>
        </div>
      </div>
      {lastMove || undoMessage ? (
        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] p-3 text-[13px] font-bold text-fp-muted-ink"
          ref={undoStatusRef}
          role="status"
          tabIndex={lastMove ? undefined : -1}
        >
          <span>
            {lastMove
              ? `${lastMove.card.title} moved to ${CARD_BUCKET_LABELS[lastMove.toBucket]}.`
              : undoMessage}
          </span>
          {lastMove ? (
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pendingId !== null}
              onClick={() => void undoLastMove()}
              ref={undoButtonRef}
              type="button"
            >
              <Undo2 aria-hidden className="h-4 w-4" />
              Undo last move
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

type PersistedBoardSection = Exclude<CardBucket, "unassigned">;
type BoardSectionKey = PersistedBoardSection | "shared";

const BOARD_SECTION_LABELS: Record<BoardSectionKey, string> = {
  alex: CARD_BUCKET_LABELS.alex,
  max: CARD_BUCKET_LABELS.max,
  notApplicable: CARD_BUCKET_LABELS.notApplicable,
  savedForLater: CARD_BUCKET_LABELS.savedForLater,
  shared: "Shared"
};

const BOARD_SECTION_HELP: Record<BoardSectionKey, string> = {
  alex: CARD_BUCKET_HELP.alex,
  max: CARD_BUCKET_HELP.max,
  notApplicable: CARD_BUCKET_HELP.notApplicable,
  savedForLater: CARD_BUCKET_HELP.savedForLater,
  shared: "Responsibilities with an explicit shared-owner agreement"
};

const BOARD_SECTION_TONES: Record<BoardSectionKey, string> = {
  alex: CARD_BUCKET_TONES.alex,
  max: CARD_BUCKET_TONES.max,
  notApplicable: CARD_BUCKET_TONES.notApplicable,
  savedForLater: CARD_BUCKET_TONES.savedForLater,
  shared: "border-[color:var(--fp-shared)]/35 bg-[color:var(--fp-shared)]/10"
};

function BoardLane({
  cardError,
  cards,
  onMove,
  pendingId,
  priority,
  section
}: {
  cardError: { cardId: string; message: string } | null;
  cards: CardWorkspaceCard[];
  onMove?: (
    card: CardWorkspaceCard,
    fromBucket: PersistedBoardSection,
    toBucket: CardDistributionBucket
  ) => Promise<void>;
  pendingId: string | null;
  priority: "primary" | "secondary" | "shared";
  section: BoardSectionKey;
}) {
  return (
    <details
      open
      data-testid={section === "shared" ? "shared-board-lane" : undefined}
      className={[
        "grid min-w-0 content-start rounded-[8px] border shadow-[var(--fp-shadow-soft)] [&>summary::-webkit-details-marker]:hidden",
        cards.length === 0
          ? "gap-2 p-3"
          : priority === "primary"
          ? "gap-4 p-3 sm:p-4 lg:min-h-[24rem] xl:min-h-[30rem]"
          : "gap-3 p-3 lg:shadow-[var(--fp-shadow-soft)]",
        BOARD_SECTION_TONES[section]
      ].join(" ")}
    >
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 rounded-[8px] outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]">
        <div>
          <h2
            className={[
              "font-bold text-fp-ink",
              priority === "primary"
                ? "text-[18px] leading-6"
                : "text-[15px] leading-5"
            ].join(" ")}
          >
            {BOARD_SECTION_LABELS[section]}
          </h2>
          <p className="mt-1 text-[12px] font-semibold leading-5 text-fp-muted-ink">
            {BOARD_SECTION_HELP[section]}
          </p>
        </div>
        <span className="rounded-[8px] border border-fp-line bg-[var(--fp-surface-strong)] px-2 py-1 text-[12px] font-bold text-fp-ink">
          {cards.length}
        </span>
      </summary>
      <div className="grid gap-3">
        {cards.map((card) => (
          <CompactCard
            bucket={section === "shared" ? bucketForCard(card) : section}
            card={card}
            error={cardError?.cardId === card.id ? cardError.message : null}
            key={card.id}
            onMove={
              onMove
                ? section === "shared"
                  ? async () => undefined
                  : (toBucket) => onMove(card, section, toBucket)
                : undefined
            }
            pending={pendingId === card.id}
          />
        ))}
        {cards.length === 0 ? (
          <p
            className="rounded-[8px] border border-dashed border-fp-line bg-[var(--fp-surface-strong)] px-3 py-2 text-[13px] font-semibold leading-5 text-fp-muted-ink sm:min-h-16 sm:py-3"
            data-testid={`empty-board-lane-${section}`}
          >
            Empty
          </p>
        ) : null}
      </div>
    </details>
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

function CompactCard({
  bucket,
  card,
  error,
  onMove,
  pending
}: {
  bucket: CardBucket;
  card: CardWorkspaceCard;
  error: string | null;
  onMove?: (bucket: CardDistributionBucket) => Promise<void>;
  pending: boolean;
}) {
  const hasActiveAssignments = card.currentAssignments.length > 0;

  return (
    <article className="grid min-w-0 overflow-visible rounded-[8px] border border-fp-line bg-[var(--fp-card)] text-left text-fp-ink shadow-[var(--fp-shadow-soft)] transition hover:-translate-y-0.5 hover:shadow-[var(--fp-shadow-elevated)]">
      <div
        className={[
          "overflow-hidden",
          onMove ? "rounded-t-[7px]" : "rounded-[7px]"
        ].join(" ")}
        data-testid="compact-card-content"
      >
        <Link
          className="grid min-h-[8.25rem] grid-cols-[5.25rem_minmax(0,1fr)] sm:grid-cols-[5.75rem_minmax(0,1fr)]"
          href={`/app/responsibilities/${card.id}`}
        >
          <CardCoverImage
            card={card}
            className="min-h-0 border-r border-fp-line bg-fp-surface p-1.5"
          />
          <span className="grid min-w-0 content-start gap-2 p-3">
            <span className="text-[16px] font-bold leading-5 text-fp-ink [overflow-wrap:anywhere]">
              {card.title}
            </span>
            <span className="line-clamp-2 text-[12px] font-semibold leading-5 text-fp-muted-ink">
              {card.areaKeys.map(humanize).slice(0, 3).join(" / ") || "Household"}
            </span>
            <span className="w-fit rounded-full border border-fp-line bg-[var(--fp-surface)] px-2.5 py-1 text-[11px] font-bold text-fp-muted-ink">
              {card.cadence.replaceAll("_", " ")}
            </span>
          </span>
        </Link>
      </div>
      {onMove ? (
        <div className="grid gap-2 rounded-b-[7px] border-t border-fp-line bg-[var(--fp-surface-strong)] p-2">
          <CardMoveMenu
            bucket={bucket}
            card={card}
            onMove={onMove}
            ownershipOnly={hasActiveAssignments}
            pending={pending}
          />
          {error ? (
            <p
              className="rounded-[8px] border border-fp-danger/40 bg-[var(--fp-surface)] p-2 text-[12px] font-bold leading-5 text-fp-danger"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CardMoveMenu({
  bucket,
  card,
  onMove,
  ownershipOnly,
  pending
}: {
  bucket: CardBucket;
  card: CardWorkspaceCard;
  onMove: (bucket: CardDistributionBucket) => Promise<void>;
  ownershipOnly: boolean;
  pending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();
  const moveBuckets = (
    ["unassigned", "alex", "max", "savedForLater", "notApplicable"] as const
  ).filter((candidate) => candidate !== bucket);

  useEffect(() => {
    if (open) {
      menuRef.current
        ?.querySelector<HTMLElement>("[role='menuitem']")
        ?.focus();
    }
  }, [open]);

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role='menuitem']") ?? []
    );
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      buttonRef.current?.focus();
      return;
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        currentIndex < 0
          ? 0
          : (currentIndex + direction + items.length) % items.length;
      items[nextIndex]?.focus();
    }
  }

  return (
    <div className="relative grid">
      <button
        aria-controls={menuId}
        aria-disabled={pending}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Move ${card.title}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] border border-fp-line bg-[var(--fp-surface)] px-3 text-[12px] font-bold text-fp-ink aria-disabled:cursor-wait aria-disabled:opacity-60"
        onClick={() => {
          if (!pending) {
            setOpen((current) => !current);
          }
        }}
        ref={buttonRef}
        type="button"
      >
        {pending ? "Moving..." : "Move"}
        <ChevronDown aria-hidden className="h-4 w-4" />
      </button>
      {open ? (
        <div
          aria-label={`Move ${card.title}`}
          className="absolute bottom-[calc(100%+0.25rem)] right-0 z-30 grid min-w-[13rem] gap-1 rounded-[8px] border border-fp-line bg-[var(--fp-card)] p-1 shadow-[var(--fp-shadow-elevated)]"
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          {ownershipOnly ? (
            <Link
              className="inline-flex min-h-11 items-center rounded-[8px] px-3 text-[12px] font-bold text-fp-ink outline-none hover:bg-[var(--fp-surface)] focus:bg-[var(--fp-surface)]"
              href={`/app/responsibilities/${card.id}#ownership-details`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              Update ownership details
            </Link>
          ) : (
            moveBuckets.map((nextBucket) => (
              <button
                className="min-h-11 rounded-[8px] px-3 text-left text-[12px] font-bold text-fp-ink outline-none hover:bg-[var(--fp-surface)] focus:bg-[var(--fp-surface)]"
                key={nextBucket}
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                  void onMove(nextBucket);
                }}
                role="menuitem"
                type="button"
              >
                {nextBucket === "unassigned"
                  ? "Return to Deal"
                  : CARD_BUCKET_LABELS[nextBucket]}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
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

function bucketFromOffset(
  offsetX: number,
  offsetY: number
): DealActionBucket | null {
  if (!Number.isFinite(offsetX) || !Number.isFinite(offsetY)) {
    return null;
  }

  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  /*
   * Mobile scrolls often start on the card. Horizontal decisions need a clear
   * distance plus axis dominance; vertical card decisions need a much stronger
   * distance/dominance so ordinary page scrolling does not mark a card.
   */
  if (
    absX >= HORIZONTAL_SWIPE_DISTANCE_PX &&
    absX > absY * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return offsetX < 0 ? "alex" : "max";
  }

  if (
    absY >= VERTICAL_SWIPE_DISTANCE_PX &&
    absY > absX * VERTICAL_DOMINANCE_RATIO
  ) {
    return offsetY < 0 ? "savedForLater" : "notApplicable";
  }

  return null;
}

function touchDealIntent(offsetX: number, offsetY: number) {
  const absX = Math.abs(offsetX);
  const absY = Math.abs(offsetY);

  if (
    absY >= VERTICAL_SWIPE_DISTANCE_PX &&
    absY > absX * VERTICAL_DOMINANCE_RATIO
  ) {
    return "drag";
  }

  if (
    absY >= TOUCH_SCROLL_DISTANCE_PX &&
    absY > absX * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return "scroll";
  }

  if (
    absX >= TOUCH_DRAG_LOCK_DISTANCE_PX &&
    absX > absY * HORIZONTAL_DOMINANCE_RATIO
  ) {
    return "drag";
  }

  return "pending";
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

function styleForDealExit(outgoing: OutgoingDealCard): CSSProperties {
  return {
    opacity: outgoing.exiting ? 0 : 1,
    transform: outgoing.exiting
      ? dealExitTransform(outgoing.bucket)
      : "translate3d(0, 0, 0)",
    transition: `transform ${DEAL_EXIT_DURATION_MS}ms ease-out, opacity ${DEAL_EXIT_DURATION_MS}ms ease-out`
  };
}

function dealExitTransform(bucket: DealActionBucket) {
  switch (bucket) {
    case "alex":
      return "translate3d(-115%, 0, 0) rotate(-8deg)";
    case "max":
      return "translate3d(115%, 0, 0) rotate(8deg)";
    case "savedForLater":
      return "translate3d(0, -115%, 0)";
    case "notApplicable":
      return "translate3d(0, 115%, 0)";
  }
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
    card.householdStandard ??
    card.sourceMinimumStandard ??
    "No standard has been written for this card yet."
  );
}

function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCardReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(value));
}
