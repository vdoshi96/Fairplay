import { CARD_BUCKET_LABELS, bucketForCard } from "./card-state";
import type { CardWorkspaceCard } from "./card-workspace-types";

export function searchCards<T extends CardWorkspaceCard>(
  cards: readonly T[],
  query: string
): T[] {
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

export function assignmentLabelFor(card: CardWorkspaceCard) {
  const owners = card.currentAssignments.filter(
    (assignment) =>
      assignment.role === "accountable_owner" ||
      assignment.role === "shared_owner"
  );

  if (owners.length > 0) {
    return owners.map((assignment) => humanize(assignment.personaKey)).join(" + ");
  }

  return CARD_BUCKET_LABELS[bucketForCard(card)];
}

export function cardPurpose(card: CardWorkspaceCard) {
  return (
    card.sourceDefinition ??
    card.summary ??
    `A ${card.areaKeys.map(humanize).join(", ") || "household"} responsibility.`
  );
}

export function cardStandards(card: CardWorkspaceCard) {
  return (
    card.householdStandard ??
    card.sourceMinimumStandard ??
    "No standard has been written for this card yet."
  );
}

export function humanize(value: string) {
  return value
    .split("_")
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCardReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric"
  }).format(new Date(value));
}
