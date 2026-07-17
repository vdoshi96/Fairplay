"use client";

import Link from "next/link";
import { ChevronDown, Undo2 } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent
} from "react";

import { HouseholdWorkMapSummary } from "./household-work-map-summary";
import {
  CARD_BUCKET_HELP,
  CARD_BUCKET_LABELS,
  CARD_BUCKET_TONES,
  bucketForCard,
  getSharedOwnerCards,
  groupCardsByBucket,
  type CardBucket,
  type CardDistributionBucket
} from "./card-state";
import { CardCoverImage } from "./card-cover-image";
import { humanize } from "./card-workspace-helpers";
import type {
  BoardWorkspaceProps,
  CardWorkspaceCard
} from "./card-workspace-types";

type LastBoardMove = {
  card: CardWorkspaceCard;
  fromBucket: PersistedBoardSection;
  toBucket: CardDistributionBucket;
};

export function BoardWorkspace({
  onDistribute,
  responsibilities,
  workMap
}: BoardWorkspaceProps) {
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
