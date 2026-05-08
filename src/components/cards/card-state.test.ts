import { describe, expect, it } from "vitest";

import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import {
  bucketForCard,
  bucketForLane,
  getCardsForPersona,
  getDistributableCards,
  groupCardsByBucket,
  laneForBucket
} from "./card-state";

function card(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: `550e8400-e29b-41d4-a716-44665544${String(
      Math.floor(Math.random() * 9999)
    ).padStart(4, "0")}`,
    title: "Kitchen reset",
    areaKeys: ["home"],
    hiddenEffortKeys: ["planning"],
    cadence: "daily",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    templateId: null,
    ...overrides
  };
}

describe("card state adapter", () => {
  it("maps stable persisted lanes to product card buckets", () => {
    expect(bucketForLane("cards_of_concern")).toBe("unassigned");
    expect(bucketForLane("kid_split")).toBe("unassigned");
    expect(bucketForLane("player_1")).toBe("alex");
    expect(bucketForLane("player_2")).toBe("max");
    expect(bucketForLane("not_in_play")).toBe("savedForLater");
    expect(bucketForLane("trimmed")).toBe("notApplicable");

    expect(laneForBucket("unassigned")).toBe("cards_of_concern");
    expect(laneForBucket("alex")).toBe("player_1");
    expect(laneForBucket("max")).toBe("player_2");
    expect(laneForBucket("savedForLater")).toBe("not_in_play");
    expect(laneForBucket("notApplicable")).toBe("trimmed");
  });

  it("keeps only unassigned cards in the distribution deck", () => {
    const deck = getDistributableCards([
      card({ title: "One", boardLane: "cards_of_concern", boardSortOrder: 2 }),
      card({ title: "Two", boardLane: "player_1" }),
      card({ title: "Three", boardLane: "kid_split", boardSortOrder: 1 }),
      card({ title: "Four", boardLane: "not_in_play", status: "paused" })
    ]);

    expect(deck.map((item) => item.title)).toEqual(["Three", "One"]);
  });

  it("deduplicates catalog cards by stable template identity without merging distinct templates", () => {
    const deck = getDistributableCards([
      card({
        id: "550e8400-e29b-41d4-a716-446655440101",
        templateId: "tpl_adult-friendships-player-1",
        title: "Adult Friendships (Alex)"
      }),
      card({
        id: "550e8400-e29b-41d4-a716-446655440102",
        templateId: "tpl_adult-friendships-player-1",
        title: "Adult Friendships (Alex)"
      }),
      card({
        id: "550e8400-e29b-41d4-a716-446655440103",
        templateId: "tpl_adult-friendships-player-2",
        title: "Adult Friendships (Max)"
      })
    ]);

    expect(deck.map((item) => item.title)).toEqual([
      "Adult Friendships (Alex)",
      "Adult Friendships (Max)"
    ]);
  });

  it("keeps an assigned catalog card out of available cards when a stale unassigned duplicate exists", () => {
    const cards = [
      card({
        id: "550e8400-e29b-41d4-a716-446655440111",
        templateId: "tpl_auto",
        title: "Auto",
        boardLane: "cards_of_concern",
        status: "unassigned"
      }),
      card({
        id: "550e8400-e29b-41d4-a716-446655440112",
        templateId: "tpl_auto",
        title: "Auto",
        boardLane: "player_1",
        currentAssignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ],
        status: "active"
      })
    ];

    expect(getDistributableCards(cards)).toHaveLength(0);
    expect(getCardsForPersona(cards, "alex").map((item) => item.id)).toEqual([
      "550e8400-e29b-41d4-a716-446655440112"
    ]);
  });

  it("treats legacy active not-in-play cards as unclassified until explicitly saved", () => {
    const legacyUnclassified = card({
      boardLane: "not_in_play",
      currentAssignments: [],
      status: "active",
      title: "Legacy waiting card"
    });
    const savedForLater = card({
      boardLane: "not_in_play",
      currentAssignments: [],
      status: "paused",
      title: "Explicitly saved card"
    });

    expect(bucketForCard(legacyUnclassified)).toBe("unassigned");
    expect(bucketForCard(savedForLater)).toBe("savedForLater");
    expect(
      getDistributableCards([savedForLater, legacyUnclassified]).map(
        (item) => item.title
      )
    ).toEqual(["Legacy waiting card"]);
  });

  it("filters the current persona's assigned cards by bucket", () => {
    const cards = [
      card({ title: "Alex card", boardLane: "player_1" }),
      card({ title: "Max card", boardLane: "player_2" }),
      card({ title: "Later card", boardLane: "not_in_play" })
    ];

    expect(getCardsForPersona(cards, "alex").map((item) => item.title)).toEqual([
      "Alex card"
    ]);
    expect(getCardsForPersona(cards, "max").map((item) => item.title)).toEqual([
      "Max card"
    ]);
  });

  it("groups all cards into polished board buckets", () => {
    const groups = groupCardsByBucket([
      card({ title: "A", boardLane: "player_1" }),
      card({ title: "B", boardLane: "player_2" }),
      card({ title: "C", boardLane: "not_in_play", status: "paused" }),
      card({ title: "D", boardLane: "trimmed" }),
      card({ title: "E", boardLane: "cards_of_concern" })
    ]);

    expect(groups.alex).toHaveLength(1);
    expect(groups.max).toHaveLength(1);
    expect(groups.savedForLater).toHaveLength(1);
    expect(groups.notApplicable).toHaveLength(1);
    expect(groups.unassigned).toHaveLength(1);
  });
});
