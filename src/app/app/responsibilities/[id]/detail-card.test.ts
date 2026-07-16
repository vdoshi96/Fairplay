import { describe, expect, it } from "vitest";

import type { ResponsibilityDetail } from "@/contracts/responsibilities";
import { detailCardFor } from "./detail-card";

function responsibility(
  overrides: Partial<ResponsibilityDetail> = {}
): ResponsibilityDetail {
  const base: ResponsibilityDetail = {
    id: "550e8400-e29b-41d4-a716-446655440010",
    title: "Auto",
    areaKeys: ["home"],
    hiddenEffortKeys: ["planning"],
    cadence: "as_needed",
    relevantDays: [],
    status: "active",
    visibility: "shared_household",
    boardLane: "not_in_play",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    summary: "AI-generated auto-ish responsibility.",
    householdStandard: "The household standard.",
    notes: null,
    lifecycleNotes: null,
    lastReviewedAt: null,
    sourceDefinition: null,
    sourceConception: null,
    sourcePlanning: null,
    sourceExecution: null,
    sourceMinimumStandard: null,
    sourceCoverAssetPath: null,
    createdAt: "2026-05-06T00:00:00.000Z",
    updatedAt: "2026-05-06T00:00:00.000Z",
    archivedAt: null
  };

  return { ...base, ...overrides } as ResponsibilityDetail;
}

describe("responsibility detail card mapping", () => {
  it("uses accepted AI sourceCoverAssetPath before title-matched source card covers", () => {
    const card = detailCardFor(
      responsibility({
        sourceCoverAssetPath:
          "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
      })
    );

    expect(card.sourceCoverAssetPath).toBe(
      "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
    );
    expect(card.coverAssetPath).toBeNull();
  });

  it("preserves source-card cover behavior for seeded title-matched cards", () => {
    const card = detailCardFor(responsibility());

    expect(card.coverAssetPath).toBe("/assets/fairplay/cards/auto.png");
    expect(card.sourceCoverAssetPath).toBeNull();
  });

  it("uses generated source fields for an accepted AI card whose title matches a source card", () => {
    const card = detailCardFor(
      responsibility({
        summary: "Generated Auto summary.",
        householdStandard: "Generated household standard.",
        sourceDefinition: "Generated definition for a custom auto workflow.",
        sourceConception: "Generated conception.",
        sourcePlanning: "Generated planning.",
        sourceExecution: "Generated execution.",
        sourceMinimumStandard: "Generated minimum standard.",
        sourceCoverAssetPath:
          "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
      })
    );

    expect(card.definition).toBe("Generated definition for a custom auto workflow.");
    expect(card.conception).toBe("Generated conception.");
    expect(card.planning).toBe("Generated planning.");
    expect(card.execution).toBe("Generated execution.");
    expect(card.minimumStandard).toBe("Generated minimum standard.");
    expect(card.householdStandard).toBe("Generated household standard.");
    expect(card.hiddenEffortKeys).toEqual(["planning"]);
    expect(card.nextReviewAt).toBeNull();
    expect(card.coverAssetPath).toBeNull();
  });
});
