import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import type { PersonaKey, ResponsibilityBoardLane } from "@/domain/enums";

export const CARD_BUCKETS = [
  "alex",
  "max",
  "savedForLater",
  "notApplicable",
  "unassigned"
] as const;

export type CardBucket = (typeof CARD_BUCKETS)[number];

export type CardDistributionBucket = CardBucket;

export type CardDistributionMove = {
  bucket: CardDistributionBucket;
  responsibilityId: string;
};

export const CARD_BUCKET_LABELS: Record<CardBucket, string> = {
  alex: "Alex",
  max: "Max",
  notApplicable: "Not Applicable",
  savedForLater: "Saved for Later",
  unassigned: "Unassigned"
};

export const CARD_BUCKET_HELP: Record<CardBucket, string> = {
  alex: "Owned by Alex",
  max: "Owned by Max",
  notApplicable: "Not part of this household right now",
  savedForLater: "Useful, but not ready to assign",
  unassigned: "Ready for a quick deal decision"
};

export const CARD_BUCKET_TONES: Record<CardBucket, string> = {
  alex: "border-[color:var(--fp-alex)]/35 bg-[color:var(--fp-alex)]/10",
  max: "border-[color:var(--fp-max)]/35 bg-[color:var(--fp-max)]/10",
  notApplicable:
    "border-[color:var(--fp-muted)]/30 bg-[color:var(--fp-muted)]/10",
  savedForLater:
    "border-[color:var(--fp-helper)]/35 bg-[color:var(--fp-helper)]/12",
  unassigned:
    "border-[color:var(--fp-shared)]/35 bg-[color:var(--fp-shared)]/10"
};

const bucketByLane: Record<ResponsibilityBoardLane, CardBucket> = {
  cards_of_concern: "unassigned",
  kid_split: "unassigned",
  not_in_play: "savedForLater",
  player_1: "alex",
  player_2: "max",
  trimmed: "notApplicable"
};

const laneByBucket: Record<CardBucket, ResponsibilityBoardLane> = {
  alex: "player_1",
  max: "player_2",
  notApplicable: "trimmed",
  savedForLater: "not_in_play",
  unassigned: "cards_of_concern"
};

export function bucketForLane(lane: ResponsibilityBoardLane): CardBucket {
  return bucketByLane[lane];
}

export function bucketForCard(
  card: Pick<
    ResponsibilitySummary,
    "boardLane" | "currentAssignments" | "status"
  >
): CardBucket {
  const owners = card.currentAssignments
    .filter(
      (assignment) =>
        assignment.role === "accountable_owner" ||
        assignment.role === "shared_owner"
    )
    .map((assignment) => assignment.personaKey)
    .sort();

  if (owners.length === 1 && (owners[0] === "alex" || owners[0] === "max")) {
    return owners[0];
  }

  if (card.boardLane === "player_1") {
    return "alex";
  }

  if (card.boardLane === "player_2") {
    return "max";
  }

  if (card.status === "not_relevant" || card.boardLane === "trimmed") {
    return "notApplicable";
  }

  if (card.status === "paused") {
    return "savedForLater";
  }

  return "unassigned";
}

export function laneForBucket(bucket: CardBucket): ResponsibilityBoardLane {
  return laneByBucket[bucket];
}

export function bucketForPersona(personaKey: PersonaKey): Extract<CardBucket, "alex" | "max"> {
  return personaKey === "max" ? "max" : "alex";
}

export function labelForCardBucket(bucket: CardBucket) {
  return CARD_BUCKET_LABELS[bucket];
}

export function getDistributableCards<T extends ResponsibilitySummary>(
  cards: readonly T[]
): T[] {
  return cards
    .filter((card) => bucketForCard(card) === "unassigned")
    .slice()
    .sort(compareCards);
}

export function getCardsForPersona<T extends ResponsibilitySummary>(
  cards: readonly T[],
  personaKey: PersonaKey
): T[] {
  const bucket = bucketForPersona(personaKey);

  return cards
    .filter((card) => bucketForCard(card) === bucket)
    .slice()
    .sort(compareCards);
}

export function groupCardsByBucket<T extends ResponsibilitySummary>(cards: readonly T[]) {
  const groups = CARD_BUCKETS.reduce(
    (next, bucket) => ({
      ...next,
      [bucket]: [] as T[]
    }),
    {} as Record<CardBucket, T[]>
  );

  cards.forEach((card) => {
    groups[bucketForCard(card)].push(card);
  });

  CARD_BUCKETS.forEach((bucket) => {
    groups[bucket].sort(compareCards);
  });

  return groups;
}

function compareCards(first: ResponsibilitySummary, second: ResponsibilitySummary) {
  return (
    first.boardSortOrder - second.boardSortOrder ||
    first.title.localeCompare(second.title)
  );
}
