import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany } = vi.hoisted(() => ({
  findMany: vi.fn()
}));

vi.mock("../db/prisma", () => ({
  prisma: {
    responsibility: {
      findMany
    }
  }
}));

import { listResponsibilitiesForHousehold } from "./responsibilities";

describe("responsibility overview summary query", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("selects only current assignments and omits history and lifecycle-note payloads", async () => {
    const createdAt = new Date("2026-07-16T12:00:00.000Z");
    const nextReviewAt = new Date("2026-07-20T12:00:00.000Z");
    findMany.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        templateId: "tpl-groceries",
        title: "Groceries",
        summary: "Keep the household supplied.",
        areaKeys: ["Daily Grind"],
        hiddenEffortKeys: ["planning"],
        cadence: "weekly",
        relevantDays: [],
        status: "active",
        visibility: "shared_household",
        boardLane: "player_1",
        boardSortOrder: 0,
        nextReviewAt,
        householdStandard: "Agree on the list before shopping.",
        sourceDefinition: "Keep groceries available.",
        sourceConception: "Notice what is running low.",
        sourcePlanning: "Plan the list and timing.",
        sourceExecution: "Shop and put items away.",
        sourceMinimumStandard: "Needed groceries are available.",
        sourceCoverAssetPath: "/assets/fairplay/cards/groceries.png",
        assignments: [
          {
            createdAt,
            endsAt: null,
            role: "accountable_owner",
            scope: "outcome",
            persona: {
              key: "alex"
            }
          }
        ]
      }
    ]);

    const result = await listResponsibilitiesForHousehold(
      "550e8400-e29b-41d4-a716-446655440000"
    );
    const query = findMany.mock.calls[0]?.[0] as {
      include?: unknown;
      select: Record<string, unknown> & {
        assignments: {
          where: Record<string, unknown>;
          select: Record<string, unknown>;
        };
      };
    };

    expect(query.include).toBeUndefined();
    expect(query.select).not.toHaveProperty("lifecycleNotes");
    expect(query.select).not.toHaveProperty("notes");
    expect(query.select.assignments.where).toEqual({ endsAt: null });
    expect(query.select.assignments.select).toEqual({
      createdAt: true,
      endsAt: true,
      role: true,
      scope: true,
      persona: {
        select: {
          key: true
        }
      }
    });
    expect(result).toEqual([
      expect.objectContaining({
        id: "550e8400-e29b-41d4-a716-446655440010",
        currentAssignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ],
        nextReviewAt: "2026-07-20T12:00:00.000Z"
      })
    ]);
    expect(JSON.stringify(result)).not.toMatch(/lifecycleNotes|handoffNotes/);
  });
});
