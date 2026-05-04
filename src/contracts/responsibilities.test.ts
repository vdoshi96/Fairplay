import { describe, expect, it } from "vitest";

import {
  ArchiveResponsibilityMutationSchema,
  LoadSnapshotSummarySchema,
  PauseResponsibilityMutationSchema,
  ResponsibilityAssignmentMutationSchema,
  ResponsibilityBoardPlacementMutationSchema,
  ResponsibilityCreateSchema,
  ResponsibilityDetailSchema,
  ResponsibilityFromTemplateMutationSchema,
  ResponsibilitySummarySchema,
  ResponsibilityUpdateSchema,
  ResponsibilityVisibilityMutationSchema
} from "./responsibilities";

describe("responsibility JSON contracts", () => {
  it("accepts the documented responsibility summary example", () => {
    expect(
      ResponsibilitySummarySchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "Evening kitchen reset",
        areaKeys: ["home_base", "food_flow"],
        hiddenEffortKeys: ["doing", "follow_through"],
        cadence: "daily",
        status: "active",
        visibility: "shared_household",
        boardLane: "cards_of_concern",
        boardSortOrder: 0,
        currentAssignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ],
        nextReviewAt: "2026-06-01T00:00:00.000Z"
      })
    ).toMatchObject({ title: "Evening kitchen reset" });
  });

  it("accepts detail, create, update, archive, pause, assignment, and load snapshot contracts", () => {
    const summary = ResponsibilitySummarySchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "Evening kitchen reset",
      areaKeys: ["home_base"],
      hiddenEffortKeys: ["doing"],
      cadence: "daily",
      status: "active",
      visibility: "shared_household",
      boardLane: "cards_of_concern",
      boardSortOrder: 0,
      currentAssignments: [],
      nextReviewAt: null
    });

    expect(
      ResponsibilityDetailSchema.parse({
        ...summary,
        summary: "A short household-authored note.",
        householdStandard: "Clear counters and set up the next morning.",
        notes: null,
        lifecycleNotes: {
          noticeDecideNotes: null,
          planPrepareNotes: null,
          executeFollowThroughNotes: null,
          dependencies: null,
          blockers: null,
          supportNeeded: null,
          handoffNotes: null,
          updatedAt: "2026-05-04T00:00:00.000Z"
        },
        lastReviewedAt: null,
        createdAt: "2026-05-04T00:00:00.000Z",
        updatedAt: "2026-05-04T00:00:00.000Z",
        archivedAt: null
      })
    ).toMatchObject({ id: summary.id });

    expect(
      ResponsibilityCreateSchema.parse({
        title: "Supply restock",
        areaKeys: ["food_flow"],
        hiddenEffortKeys: ["noticing", "planning"],
        cadence: "as_needed",
        visibility: "shared_household",
        householdStandard: "Keep commonly used items ready.",
        currentAssignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ]
      })
    ).toMatchObject({ title: "Supply restock" });

    expect(
      ResponsibilityCreateSchema.parse({
        title: "Morning launch",
        areaKeys: ["home_base"],
        hiddenEffortKeys: ["planning"],
        cadence: "daily"
      })
    ).toMatchObject({ visibility: "shared_household" });

    expect(
      ResponsibilityUpdateSchema.parse({
        id: summary.id,
        nextReviewAt: "2026-06-01T00:00:00.000Z"
      })
    ).toMatchObject({ nextReviewAt: "2026-06-01T00:00:00.000Z" });

    expect(ArchiveResponsibilityMutationSchema.parse({ id: summary.id })).toEqual({
      id: summary.id
    });
    expect(
      PauseResponsibilityMutationSchema.parse({
        id: summary.id,
        reviewOn: "2026-06-01T00:00:00.000Z",
        note: "Pause until the schedule settles."
      })
    ).toMatchObject({ id: summary.id });
    expect(
      ResponsibilityAssignmentMutationSchema.parse({
        responsibilityId: summary.id,
        assignments: [
          { personaKey: "alex", role: "helper", scope: "support" }
        ],
        effectiveAt: "2026-05-04T00:00:00.000Z"
      })
    ).toMatchObject({ responsibilityId: summary.id });

    expect(
      LoadSnapshotSummarySchema.parse({
        periodStart: "2026-05-01T00:00:00.000Z",
        periodEnd: "2026-05-31T00:00:00.000Z",
        computedAt: "2026-05-04T00:00:00.000Z",
        ownerDistribution: { alex: 1, max: 1, unassigned: 0 },
        sharedDistribution: { sharedOwnerCount: 1, helperOrBackupCount: 1 },
        areaDistribution: { home_base: 1 },
        cadenceDistribution: { daily: 1 },
        reviewDueCount: 1,
        radarOpenCount: 1,
        pausedOrNotRelevantCount: 0,
        hiddenEffortMix: { doing: 1 }
      })
    ).toMatchObject({ reviewDueCount: 1 });
  });

  it("rejects direct visibility changes in the general update contract", () => {
    expect(() =>
      ResponsibilityUpdateSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440010",
        visibility: "shared_household"
      })
    ).toThrow();
  });

  it("rejects status and assignment changes in the general update contract", () => {
    const id = "550e8400-e29b-41d4-a716-446655440010";

    for (const status of ["active", "paused", "not_relevant", "archived"]) {
      expect(() =>
        ResponsibilityUpdateSchema.parse({
          id,
          status
        })
      ).toThrow();
    }

    expect(() =>
      ResponsibilityUpdateSchema.parse({
        id,
        currentAssignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ]
      })
    ).toThrow();
  });

  it("rejects private visibility when creating responsibilities", () => {
    expect(() =>
      ResponsibilityCreateSchema.parse({
        title: "Private responsibility draft",
        areaKeys: ["home_base"],
        hiddenEffortKeys: ["planning"],
        cadence: "daily",
        visibility: "private"
      })
    ).toThrow();
  });

  it("requires confirmation before changing a private responsibility to visible spaces", () => {
    const responsibilityId = "550e8400-e29b-41d4-a716-446655440010";

    for (const toVisibility of [
      "shared_household",
      "partner_visible",
      "check_in_only"
    ]) {
      expect(() =>
        ResponsibilityVisibilityMutationSchema.parse({
          responsibilityId,
          fromVisibility: "private",
          toVisibility
        })
      ).toThrow();

      expect(
        ResponsibilityVisibilityMutationSchema.parse({
          responsibilityId,
          fromVisibility: "private",
          toVisibility,
          confirmedVisibilityChange: true
        })
      ).toMatchObject({
        responsibilityId,
        fromVisibility: "private",
        toVisibility,
        confirmedVisibilityChange: true
      });
    }
  });
});

describe("Responsibility board contracts", () => {
  it("validates board placement mutations", () => {
    expect(
      ResponsibilityBoardPlacementMutationSchema.parse({
        responsibilityId: "550e8400-e29b-41d4-a716-446655440010",
        toLane: "player_1",
        sortOrder: 4,
        actorPersonaId: "550e8400-e29b-41d4-a716-446655440020"
      })
    ).toMatchObject({
      toLane: "player_1",
      sortOrder: 4
    });

    expect(() =>
      ResponsibilityBoardPlacementMutationSchema.parse({
        responsibilityId: "550e8400-e29b-41d4-a716-446655440010",
        toLane: "parking_lot",
        sortOrder: -1
      })
    ).toThrow();
  });

  it("exposes lane and sort order on summaries", () => {
    const summary = ResponsibilitySummarySchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "Auto",
      areaKeys: ["Out"],
      hiddenEffortKeys: ["planning"],
      cadence: "as_needed",
      relevantDays: [],
      status: "unassigned",
      visibility: "shared_household",
      boardLane: "not_in_play",
      boardSortOrder: 12,
      linkedRadarItems: [],
      currentAssignments: [],
      nextReviewAt: null
    });

    expect(summary.boardLane).toBe("not_in_play");
  });

  it("validates from-template creation", () => {
    expect(
      ResponsibilityFromTemplateMutationSchema.parse({
        templateId: "tpl_auto",
        actorPersonaId: "550e8400-e29b-41d4-a716-446655440020",
        lane: "cards_of_concern"
      })
    ).toMatchObject({ lane: "cards_of_concern" });
  });
});
