import type { PersonaKey, ResponsibilityBoardLane } from "./enums";

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

export function laneForBucket(bucket: CardBucket): ResponsibilityBoardLane {
  return laneByBucket[bucket];
}

export function bucketForPersona(
  personaKey: PersonaKey
): Extract<CardBucket, "alex" | "max"> {
  return personaKey === "max" ? "max" : "alex";
}

export function labelForCardBucket(bucket: CardBucket) {
  return CARD_BUCKET_LABELS[bucket];
}
