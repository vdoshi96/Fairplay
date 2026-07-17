import { describe, expect, it } from "vitest";

import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import { selectResponsibilitiesWorthReviewing } from "./responsibility-review";

function responsibility(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    templateId: null,
    title: "Household responsibility",
    areaKeys: ["home_base"],
    hiddenEffortKeys: ["planning"],
    cadence: "monthly",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    ...overrides
  };
}

describe("selectResponsibilitiesWorthReviewing", () => {
  it("includes active cards whose review date is due and every needs-review card", () => {
    const result = selectResponsibilitiesWorthReviewing({
      responsibilities: [
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440011",
          title: "Due today",
          nextReviewAt: "2026-07-16T12:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440012",
          title: "Marked for review",
          status: "needs_review",
          nextReviewAt: "2026-08-01T00:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440013",
          title: "Not due yet",
          nextReviewAt: "2026-07-17T00:00:00.000Z"
        })
      ],
      asOf: "2026-07-16T12:00:00.000Z"
    });

    expect(result.map((item) => item.title)).toEqual([
      "Due today",
      "Marked for review"
    ]);
  });

  it("excludes catalog-only, paused, not-applicable, and archived cards", () => {
    const result = selectResponsibilitiesWorthReviewing({
      responsibilities: [
        responsibility({ status: "unassigned", nextReviewAt: "2026-07-01T00:00:00.000Z" }),
        responsibility({ status: "paused", nextReviewAt: "2026-07-01T00:00:00.000Z" }),
        responsibility({ status: "not_relevant", nextReviewAt: "2026-07-01T00:00:00.000Z" }),
        responsibility({ status: "archived", nextReviewAt: "2026-07-01T00:00:00.000Z" })
      ],
      asOf: "2026-07-16T12:00:00.000Z"
    });

    expect(result).toEqual([]);
  });

  it("sorts undated review markers first, then review dates and titles without mutating input", () => {
    const responsibilities = [
      responsibility({
        id: "550e8400-e29b-41d4-a716-446655440021",
        title: "Laundry",
        status: "needs_review",
        nextReviewAt: null
      }),
      responsibility({
        id: "550e8400-e29b-41d4-a716-446655440022",
        title: "Dishes",
        nextReviewAt: "2026-07-10T00:00:00.000Z"
      }),
      responsibility({
        id: "550e8400-e29b-41d4-a716-446655440023",
        title: "Auto",
        nextReviewAt: "2026-07-10T00:00:00.000Z"
      })
    ];

    const result = selectResponsibilitiesWorthReviewing({
      responsibilities,
      asOf: "2026-07-16T12:00:00.000Z"
    });

    expect(result.map((item) => item.title)).toEqual(["Laundry", "Auto", "Dishes"]);
    expect(responsibilities.map((item) => item.title)).toEqual([
      "Laundry",
      "Dishes",
      "Auto"
    ]);
  });

  it("rejects an invalid comparison date", () => {
    expect(() =>
      selectResponsibilitiesWorthReviewing({ responsibilities: [], asOf: "not-a-date" })
    ).toThrow("Responsibility review asOf must be a valid date.");
  });
});
