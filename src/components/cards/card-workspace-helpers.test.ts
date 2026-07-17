import { describe, expect, it } from "vitest";

import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import {
  assignmentLabelFor,
  cardPurpose,
  cardStandards,
  humanize,
  searchCards
} from "./card-workspace-helpers";

function card(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "School lunch",
    areaKeys: ["kids", "food"],
    hiddenEffortKeys: ["noticing", "planning"],
    cadence: "daily",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    templateId: null,
    sourceCoverAssetPath: null,
    sourceDefinition: "Pack and keep lunch ready for the school day.",
    sourceMinimumStandard: "Lunch is packed before school starts.",
    ...overrides
  };
}

describe("card workspace helpers", () => {
  it("searches all operational card context without mutating the source list", () => {
    const cards = [
      card(),
      card({
        id: "other",
        title: "Laundry",
        areaKeys: ["home_base"],
        sourceDefinition: "Wash and put away clothes.",
        sourceMinimumStandard: "Clean clothes are available."
      })
    ];

    expect(searchCards(cards, "packed").map((item) => item.title)).toEqual([
      "School lunch"
    ]);
    expect(searchCards(cards, "home_base").map((item) => item.title)).toEqual([
      "Laundry"
    ]);
    expect(searchCards(cards, "")).not.toBe(cards);
    expect(cards).toHaveLength(2);
  });

  it("derives descriptive labels, purpose, and standards", () => {
    const owned = card({
      currentAssignments: [
        { personaKey: "alex", role: "accountable_owner", scope: "outcome" },
        { personaKey: "max", role: "shared_owner", scope: "part" }
      ]
    });

    expect(assignmentLabelFor(owned)).toBe("Alex + Max");
    expect(cardPurpose(owned)).toContain("Pack and keep lunch");
    expect(cardStandards(owned)).toContain("Lunch is packed");
    expect(humanize("saved_for_later")).toBe("Saved For Later");
  });
});
