import { describe, expect, it } from "vitest";

import { HouseholdWorkMapSchema } from "@/contracts/household-work-map";
import type { ResponsibilitySummary } from "@/contracts/responsibilities";
import { computeHouseholdWorkMap } from "./household-work-map";

function responsibility(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    templateId: null,
    title: "Household responsibility",
    areaKeys: ["home_base"],
    hiddenEffortKeys: ["doing"],
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

describe("computeHouseholdWorkMap", () => {
  it("counts active ownership, frequency, review timing, and hidden effort per persona", () => {
    const workMap = computeHouseholdWorkMap({
      responsibilities: [
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440011",
          cadence: "daily",
          hiddenEffortKeys: ["noticing", "planning", "planning"],
          currentAssignments: [
            {
              personaKey: "alex",
              role: "accountable_owner",
              scope: "outcome"
            }
          ],
          nextReviewAt: "2026-08-01T00:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440012",
          cadence: "weekly",
          hiddenEffortKeys: ["doing", "follow_through"],
          status: "needs_review",
          currentAssignments: [
            { personaKey: "max", role: "shared_owner", scope: "part" },
            { personaKey: "alex", role: "helper", scope: "support" }
          ]
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440013",
          hiddenEffortKeys: ["emotional_attention"],
          currentAssignments: [
            { personaKey: "alex", role: "backup", scope: "temporary" },
            { personaKey: "max", role: "helper", scope: "support" }
          ],
          nextReviewAt: "2026-07-15T00:00:00.000Z"
        })
      ],
      asOf: "2026-07-16T00:00:00.000Z"
    });

    expect(workMap).toEqual({
      personas: {
        alex: {
          owned: 1,
          sharedOwned: 0,
          highFrequency: 1,
          dueReview: 0,
          hiddenEffort: {
            noticing: 1,
            planning: 1,
            doing: 0,
            follow_through: 0,
            emotional_attention: 0
          }
        },
        max: {
          owned: 1,
          sharedOwned: 1,
          highFrequency: 1,
          dueReview: 1,
          hiddenEffort: {
            noticing: 0,
            planning: 0,
            doing: 1,
            follow_through: 1,
            emotional_attention: 0
          }
        }
      },
      household: {
        shared: 1,
        unassigned: 1,
        paused: 0,
        notApplicable: 0,
        dueReview: 2
      }
    });

    expect(HouseholdWorkMapSchema.parse(workMap)).toEqual(workMap);
  });

  it("counts a responsibility once per persona when owner assignments repeat", () => {
    const workMap = computeHouseholdWorkMap({
      responsibilities: [
        responsibility({
          cadence: "weekly",
          currentAssignments: [
            {
              personaKey: "alex",
              role: "accountable_owner",
              scope: "outcome"
            },
            { personaKey: "alex", role: "shared_owner", scope: "part" },
            { personaKey: "max", role: "shared_owner", scope: "part" }
          ]
        })
      ]
    });

    expect(workMap.personas.alex).toMatchObject({
      owned: 1,
      sharedOwned: 1,
      highFrequency: 1
    });
    expect(workMap.personas.max).toMatchObject({
      owned: 1,
      sharedOwned: 1,
      highFrequency: 1
    });
    expect(workMap.household.shared).toBe(1);
  });

  it("excludes catalog-only, paused, not-applicable, and archived cards from persona workload", () => {
    const excludedOwner = {
      personaKey: "alex" as const,
      role: "accountable_owner" as const,
      scope: "outcome" as const
    };
    const workMap = computeHouseholdWorkMap({
      responsibilities: [
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440021",
          status: "unassigned",
          cadence: "daily",
          currentAssignments: [excludedOwner],
          nextReviewAt: "2026-07-01T00:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440022",
          status: "paused",
          cadence: "daily",
          currentAssignments: [excludedOwner],
          nextReviewAt: "2026-07-01T00:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440023",
          status: "not_relevant",
          currentAssignments: [
            { personaKey: "alex", role: "shared_owner", scope: "part" }
          ],
          nextReviewAt: "2026-07-01T00:00:00.000Z"
        }),
        responsibility({
          id: "550e8400-e29b-41d4-a716-446655440024",
          status: "archived",
          currentAssignments: [excludedOwner]
        })
      ],
      asOf: "2026-07-16T00:00:00.000Z"
    });

    expect(workMap.personas).toEqual({
      alex: {
        owned: 0,
        sharedOwned: 0,
        highFrequency: 0,
        dueReview: 0,
        hiddenEffort: {
          noticing: 0,
          planning: 0,
          doing: 0,
          follow_through: 0,
          emotional_attention: 0
        }
      },
      max: {
        owned: 0,
        sharedOwned: 0,
        highFrequency: 0,
        dueReview: 0,
        hiddenEffort: {
          noticing: 0,
          planning: 0,
          doing: 0,
          follow_through: 0,
          emotional_attention: 0
        }
      }
    });
    expect(workMap.household).toEqual({
      shared: 0,
      unassigned: 0,
      paused: 1,
      notApplicable: 1,
      dueReview: 0
    });
  });

  it("treats review dates at the boundary as due and rejects invalid asOf values", () => {
    const workMap = computeHouseholdWorkMap({
      responsibilities: [
        responsibility({
          currentAssignments: [
            {
              personaKey: "max",
              role: "accountable_owner",
              scope: "outcome"
            }
          ],
          nextReviewAt: "2026-07-16T12:00:00.000Z"
        })
      ],
      asOf: "2026-07-16T12:00:00.000Z"
    });

    expect(workMap.personas.max.dueReview).toBe(1);
    expect(workMap.household.dueReview).toBe(1);
    expect(() =>
      computeHouseholdWorkMap({ responsibilities: [], asOf: "not-a-date" })
    ).toThrow("Household work map asOf must be a valid date.");
  });
});
