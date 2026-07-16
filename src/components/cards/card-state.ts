import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import {
  CARD_BUCKETS,
  bucketForPersona,
  type CardBucket
} from "@/domain/card-distribution";
import type { PersonaKey } from "@/domain/enums";

export * from "@/domain/card-distribution";

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

export function getDistributableCards<T extends ResponsibilitySummary>(
  cards: readonly T[]
): T[] {
  return deduplicateCatalogCards(cards)
    .filter((card) => bucketForCard(card) === "unassigned")
    .slice()
    .sort(compareCards);
}

export function getCardsForPersona<T extends ResponsibilitySummary>(
  cards: readonly T[],
  personaKey: PersonaKey
): T[] {
  const bucket = bucketForPersona(personaKey);

  return deduplicateCatalogCards(cards)
    .filter((card) => {
      const explicitOwners = card.currentAssignments.filter(
        (assignment) =>
          assignment.role === "accountable_owner" ||
          assignment.role === "shared_owner"
      );

      if (explicitOwners.length > 0) {
        return explicitOwners.some(
          (assignment) => assignment.personaKey === personaKey
        );
      }

      // Older records may have an owner lane without assignment history. Keep
      // that compatibility fallback, but never let one persisted lane hide a
      // genuinely shared agreement from either owner.
      return bucketForCard(card) === bucket;
    })
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

  deduplicateCatalogCards(cards).forEach((card) => {
    groups[bucketForCard(card)].push(card);
  });

  CARD_BUCKETS.forEach((bucket) => {
    groups[bucket].sort(compareCards);
  });

  return groups;
}

export function getSharedOwnerCards<T extends ResponsibilitySummary>(
  cards: readonly T[]
): T[] {
  return deduplicateCatalogCards(cards)
    .filter(
      (card) =>
        (card.status === "active" || card.status === "needs_review") &&
        card.currentAssignments.some(
          (assignment) => assignment.role === "shared_owner"
        )
    )
    .slice()
    .sort(compareCards);
}

function deduplicateCatalogCards<T extends ResponsibilitySummary>(
  cards: readonly T[]
): T[] {
  const byCatalogKey = new Map<string, T>();

  cards.forEach((card) => {
    const key = catalogIdentityForCard(card);
    const current = byCatalogKey.get(key);

    if (!current || compareCatalogCanonical(card, current) < 0) {
      byCatalogKey.set(key, card);
    }
  });

  return [...byCatalogKey.values()];
}

function catalogIdentityForCard(card: ResponsibilitySummary) {
  return card.templateId ? `template:${card.templateId}` : `responsibility:${card.id}`;
}

function compareCatalogCanonical(
  first: ResponsibilitySummary,
  second: ResponsibilitySummary
) {
  return (
    bucketPriority(bucketForCard(second)) - bucketPriority(bucketForCard(first)) ||
    first.boardSortOrder - second.boardSortOrder ||
    first.title.localeCompare(second.title) ||
    first.id.localeCompare(second.id)
  );
}

function bucketPriority(bucket: CardBucket) {
  switch (bucket) {
    case "alex":
    case "max":
      return 4;
    case "savedForLater":
    case "notApplicable":
      return 3;
    case "unassigned":
      return 1;
  }
}

function compareCards(first: ResponsibilitySummary, second: ResponsibilitySummary) {
  return (
    first.boardSortOrder - second.boardSortOrder ||
    first.title.localeCompare(second.title)
  );
}
