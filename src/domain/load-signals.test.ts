import { describe, expect, it } from "vitest";

import { computeLoadSignals } from "./load-signals";

const forbiddenKeys = new Set([
  "score",
  "scores",
  "winner",
  "loser",
  "grade",
  "diagnosis",
  "diagnosticLabel",
  "label"
]);

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectKeys);
  }

  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested)
  ]);
}

describe("computeLoadSignals", () => {
  it("returns aggregate counts without scores, winners, losers, grades, or diagnostic labels", () => {
    const result = computeLoadSignals({
      responsibilities: [
        {
          id: "resp_1",
          areaKeys: ["home_base", "food_flow"],
          hiddenEffortKeys: ["doing", "follow_through"],
          cadence: "daily",
          status: "active",
          currentAssignments: [
            { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
          ],
          nextReviewAt: "2026-05-01T00:00:00.000Z"
        },
        {
          id: "resp_2",
          areaKeys: ["paper_trail"],
          hiddenEffortKeys: ["planning"],
          cadence: "monthly",
          status: "paused",
          currentAssignments: [
            { personaKey: "max", role: "shared_owner", scope: "part" },
            { personaKey: "alex", role: "helper", scope: "support" }
          ],
          nextReviewAt: "2026-06-01T00:00:00.000Z"
        }
      ],
      asOf: "2026-05-04T00:00:00.000Z"
    });

    expect(result).toEqual({
      totalResponsibilities: 2,
      ownerDistribution: { alex: 1, max: 1, unassigned: 0 },
      sharedResponsibilityCount: 1,
      highFrequencyCount: 1,
      dueForReviewCount: 1,
      pausedOrNotRelevantCount: 1,
      hiddenEffortMix: {
        noticing: 0,
        planning: 1,
        doing: 1,
        follow_through: 1,
        emotional_attention: 0
      },
      areaMix: {
        home_base: 1,
        food_flow: 1,
        paper_trail: 1
      },
      cadenceDistribution: {
        daily: 1,
        weekly: 0,
        monthly: 1,
        seasonal: 0,
        event_based: 0,
        as_needed: 0,
        one_time: 0
      }
    });

    expect(collectKeys(result).filter((key) => forbiddenKeys.has(key))).toEqual([]);
  });
});
