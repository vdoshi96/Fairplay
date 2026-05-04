import { describe, expect, it, vi } from "vitest";

import type { CurrentSession } from "@/server/auth/current-session";
import {
  CheckInServiceError,
  createCheckInService,
  type CheckInServiceDeps
} from "./service";
import { buildCheckInSummary, containsUnsafeSummaryLanguage } from "./summary";

const householdId = "550e8400-e29b-41d4-a716-446655440000";
const otherHouseholdId = "550e8400-e29b-41d4-a716-446655440099";
const alexId = "550e8400-e29b-41d4-a716-446655440001";
const checkInId = "550e8400-e29b-41d4-a716-446655440080";
const itemId = "550e8400-e29b-41d4-a716-446655440081";
const otherHouseholdItemId = "550e8400-e29b-41d4-a716-446655440089";
const radarId = "550e8400-e29b-41d4-a716-446655440090";
const responsibilityId = "550e8400-e29b-41d4-a716-446655440070";
const otherResponsibilityId = "550e8400-e29b-41d4-a716-446655440071";

const session: CurrentSession = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId,
  selectedPersonaId: alexId,
  createdAt: "2026-05-04T12:00:00.000Z",
  lastSeenAt: "2026-05-04T12:00:00.000Z",
  expiresAt: "2026-06-04T12:00:00.000Z",
  revokedAt: null,
  userAgentHash: null
};

function checkIn(overrides: Record<string, unknown> = {}) {
  return {
    id: checkInId,
    householdId,
    state: "active",
    scheduledFor: null,
    startedAt: "2026-05-04T12:00:00.000Z",
    completedAt: null,
    facilitatorPersonaKey: "alex",
    summary: null,
    items: [
      {
        id: itemId,
        itemType: "radar",
        state: "queued",
        promptKey: "radar_discussion",
        radarItemId: radarId,
        responsibilityId: null,
        sortOrder: 0,
        title: "Clarify morning handoff",
        description: "Shared household",
        visibility: "shared_household",
        response: null,
        decisionId: null
      }
    ],
    decisions: [],
    ...overrides
  } as const;
}

function makeDeps(overrides: Partial<CheckInServiceDeps> = {}): CheckInServiceDeps {
  return {
    ensurePersonaInHousehold: vi.fn().mockResolvedValue(true),
    getActiveCheckIn: vi.fn().mockResolvedValue(null),
    getCheckIn: vi.fn().mockResolvedValue(checkIn()),
    listAgendaSources: vi.fn().mockResolvedValue({
      radarItems: [
        {
          id: radarId,
          topic: "Clarify morning handoff",
          reasonKey: "unclear_expectation",
          visibility: "shared_household",
          state: "open",
          responsibilityId: null
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440091",
          topic: "Blocked pickup plan",
          reasonKey: "blocked",
          visibility: "check_in_only",
          state: "scheduled",
          responsibilityId: null
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440092",
          topic: "Restock expectation",
          reasonKey: "review_due",
          visibility: "partner_visible",
          state: "open",
          responsibilityId: null
        }
      ],
      responsibilities: [
        {
          id: responsibilityId,
          title: "Weekly meal outline",
          status: "needs_review",
          cadence: "weekly",
          nextReviewAt: "2026-05-01T12:00:00.000Z"
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440071",
          title: "Supply restock",
          status: "active",
          cadence: "weekly",
          nextReviewAt: "2026-05-02T12:00:00.000Z"
        },
        {
          id: "550e8400-e29b-41d4-a716-446655440072",
          title: "Bill due-date review",
          status: "active",
          cadence: "monthly",
          nextReviewAt: "2026-05-03T12:00:00.000Z"
        }
      ]
    }),
    createCheckIn: vi.fn().mockResolvedValue(checkIn()),
    updateItem: vi.fn().mockImplementation(async (input) => ({
      ...checkIn().items[0],
      state: input.state,
      response: input.response ?? null
    })),
    recordDecisionForItem: vi.fn().mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440082",
      decisionType: "assign_owner",
      summary: "Alex carries meal planning until the next review.",
      effectiveAt: "2026-05-04T12:00:00.000Z",
      reviewOn: "2026-06-04T12:00:00.000Z",
      responsibilityId
    }),
    applyResponsibilityDecision: vi.fn().mockResolvedValue(undefined),
    applyRadarDecision: vi.fn().mockResolvedValue(undefined),
    completeCheckIn: vi.fn().mockImplementation(async (input) => ({
      ...checkIn(),
      state: "completed",
      completedAt: input.completedAt,
      summary: input.summary
    })),
    ...overrides
  };
}

function responsibilityDecisionInput(
  input: { responsibilityId?: string | null } = {}
) {
  return {
    decisionType: "assign_owner" as const,
    summary: "Alex carries meal planning until the next review.",
    effectiveAt: "2026-05-04T12:00:00.000Z",
    reviewOn: "2026-06-04T12:00:00.000Z",
    responsibilityId: input.responsibilityId ?? responsibilityId,
    responsibilityEffect: {
      kind: "assign_owner" as const,
      assignments: [
        {
          personaKey: "alex" as const,
          role: "accountable_owner" as const,
          scope: "outcome" as const
        }
      ],
      revisitAt: "2026-06-04T12:00:00.000Z"
    }
  };
}

describe("check-in service", () => {
  it("creates a short agenda from open radar and due reviews capped at five", async () => {
    const deps = makeDeps();
    const service = createCheckInService(deps);

    const agenda = await service.create(session, { maxItems: 5 });

    expect(deps.createCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        facilitatorPersonaId: alexId,
        state: "active",
        items: expect.arrayContaining([
          expect.objectContaining({ radarItemId: radarId }),
          expect.objectContaining({ responsibilityId })
        ])
      })
    );
    expect(agenda.items).toHaveLength(1);
    expect((deps.createCheckIn as ReturnType<typeof vi.fn>).mock.calls[0][0].items)
      .toHaveLength(5);
  });

  it("caps requested agenda size above five for create and preview", async () => {
    const deps = makeDeps();
    const service = createCheckInService(deps);

    await service.create(session, { maxItems: 8 });
    const preview = await service.preview(session, { maxItems: 8 });

    expect((deps.createCheckIn as ReturnType<typeof vi.fn>).mock.calls[0][0].items)
      .toHaveLength(5);
    expect(preview.items).toHaveLength(5);
  });

  it("normalizes negative agenda size for direct create and preview calls", async () => {
    const deps = makeDeps({
      listAgendaSources: vi.fn().mockResolvedValue({
        radarItems: Array.from({ length: 5 }, (_, index) => ({
          id: `550e8400-e29b-41d4-a716-44665544009${index}` as const,
          topic: `Radar topic ${index + 1}`,
          reasonKey: "unclear_expectation",
          visibility: "shared_household",
          state: "open",
          responsibilityId: null
        })),
        responsibilities: Array.from({ length: 5 }, (_, index) => ({
          id: `550e8400-e29b-41d4-a716-44665544007${index}` as const,
          title: `Responsibility ${index + 1}`,
          status: "needs_review",
          cadence: "weekly",
          nextReviewAt: "2026-05-01T12:00:00.000Z"
        }))
      })
    });
    const service = createCheckInService(deps);

    await service.create(session, { maxItems: -1 });
    const preview = await service.preview(session, { maxItems: -1 });

    expect((deps.createCheckIn as ReturnType<typeof vi.fn>).mock.calls[0][0].items.length)
      .toBeLessThanOrEqual(5);
    expect(preview.items.length).toBeLessThanOrEqual(5);
  });

  it("resumes the active check-in instead of creating another one", async () => {
    const deps = makeDeps({ getActiveCheckIn: vi.fn().mockResolvedValue(checkIn()) });
    const service = createCheckInService(deps);

    const agenda = await service.create(session, {});

    expect(agenda.id).toBe(checkInId);
    expect(deps.createCheckIn).not.toHaveBeenCalled();
  });

  it("previews agenda items without creating or resuming an active check-in", async () => {
    const deps = makeDeps({ getActiveCheckIn: vi.fn().mockResolvedValue(checkIn()) });
    const service = createCheckInService(deps);

    const preview = await service.preview(session, { maxItems: 2 });

    expect(deps.getActiveCheckIn).not.toHaveBeenCalled();
    expect(deps.createCheckIn).not.toHaveBeenCalled();
    expect(preview.items).toHaveLength(2);
    expect(preview.items[0]).toEqual(
      expect.objectContaining({
        state: "queued",
        radarItemId: radarId,
        title: "Clarify morning handoff"
      })
    );
  });

  it("updates skipped and deferred item states without creating a decision", async () => {
    const deps = makeDeps();
    const service = createCheckInService(deps);

    await service.updateItem(session, checkInId, itemId, {
      state: "skipped",
      response: "Not today."
    });
    await service.updateItem(session, checkInId, itemId, {
      state: "deferred",
      response: "Return next week."
    });

    expect(deps.updateItem).toHaveBeenCalledTimes(2);
    expect(deps.recordDecisionForItem).not.toHaveBeenCalled();
    expect(deps.applyResponsibilityDecision).not.toHaveBeenCalled();
  });

  it("rejects item updates when the item is not nested in the household check-in", async () => {
    const deps = makeDeps();
    const service = createCheckInService(deps);

    await expect(
      service.updateItem(session, checkInId, otherHouseholdItemId, {
        state: "skipped",
        response: "Not today."
      })
    ).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
    expect(deps.updateItem).not.toHaveBeenCalled();
  });

  it("applies responsibility changes only through the explicit decision path", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [{ ...checkIn().items[0], responsibilityId }]
        })
      )
    });
    const service = createCheckInService(deps);

    await service.updateItem(session, checkInId, itemId, {
      state: "discussed",
      response: "Talked through ownership."
    });
    expect(deps.applyResponsibilityDecision).not.toHaveBeenCalled();

    await service.recordDecision(session, checkInId, itemId, {
      decisionType: "assign_owner",
      summary: "Alex carries meal planning until the next review.",
      effectiveAt: "2026-05-04T12:00:00.000Z",
      reviewOn: "2026-06-04T12:00:00.000Z",
      responsibilityId,
      responsibilityEffect: {
        kind: "assign_owner",
        assignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ],
        handoffNotes: "Alex will outline the plan.",
        revisitAt: "2026-06-04T12:00:00.000Z"
      }
    });

    expect(deps.recordDecisionForItem).toHaveBeenCalledWith(
      expect.objectContaining({ createdByPersonaId: alexId })
    );
    expect(deps.applyResponsibilityDecision).toHaveBeenCalledWith(
      expect.objectContaining({ responsibilityId })
    );
  });

  it("allows responsibility effects for a responsibility agenda item", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              itemType: "responsibility",
              radarItemId: null,
              responsibilityId
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    await service.recordDecision(
      session,
      checkInId,
      itemId,
      responsibilityDecisionInput()
    );

    expect(deps.applyResponsibilityDecision).toHaveBeenCalledWith(
      expect.objectContaining({ responsibilityId })
    );
  });

  it("allows responsibility effects for a radar item linked to that responsibility", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              itemType: "radar",
              radarItemId: radarId,
              responsibilityId
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    await service.recordDecision(
      session,
      checkInId,
      itemId,
      responsibilityDecisionInput()
    );

    expect(deps.applyResponsibilityDecision).toHaveBeenCalledWith(
      expect.objectContaining({ responsibilityId })
    );
  });

  it("rejects responsibility effects for custom agenda items", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              itemType: "custom",
              radarItemId: null,
              responsibilityId: null
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    await expect(
      service.recordDecision(
        session,
        checkInId,
        itemId,
        responsibilityDecisionInput()
      )
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(deps.recordDecisionForItem).not.toHaveBeenCalled();
    expect(deps.applyResponsibilityDecision).not.toHaveBeenCalled();
  });

  it("rejects responsibility effects for a different local responsibility", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              itemType: "responsibility",
              radarItemId: null,
              responsibilityId
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    await expect(
      service.recordDecision(
        session,
        checkInId,
        itemId,
        responsibilityDecisionInput({ responsibilityId: otherResponsibilityId })
      )
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(deps.recordDecisionForItem).not.toHaveBeenCalled();
    expect(deps.applyResponsibilityDecision).not.toHaveBeenCalled();
  });

  it("rejects decisions for completed check-ins before creating a decision", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(checkIn({ state: "completed" }))
    });
    const service = createCheckInService(deps);

    await expect(
      service.recordDecision(
        session,
        checkInId,
        itemId,
        responsibilityDecisionInput({ responsibilityId: null })
      )
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(deps.recordDecisionForItem).not.toHaveBeenCalled();
  });

  it("rejects duplicate decisions for the same agenda item", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              state: "discussed",
              decisionId: "550e8400-e29b-41d4-a716-446655440082"
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    await expect(
      service.recordDecision(
        session,
        checkInId,
        itemId,
        responsibilityDecisionInput({ responsibilityId: null })
      )
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
    expect(deps.recordDecisionForItem).not.toHaveBeenCalled();
  });

  it("persists a factual generated summary and completion timestamp", async () => {
    const deps = makeDeps({
      getCheckIn: vi.fn().mockResolvedValue(
        checkIn({
          items: [
            {
              ...checkIn().items[0],
              state: "deferred",
              title: "Clarify morning handoff"
            }
          ],
          decisions: [
            {
              decisionType: "schedule_review",
              summary: "Review the meal plan in June.",
              reviewOn: "2026-06-04T12:00:00.000Z"
            }
          ]
        })
      )
    });
    const service = createCheckInService(deps);

    const completed = await service.complete(session, checkInId, {
      completedAt: "2026-05-04T13:00:00.000Z"
    });

    expect(deps.completeCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        completedAt: "2026-05-04T13:00:00.000Z",
        summary: expect.stringContaining("Decisions")
      })
    );
    expect(completed.state).toBe("completed");
    expect(completed.summary).toContain("Review the meal plan in June.");
  });

  it("rejects cross-household access", async () => {
    const service = createCheckInService(
      makeDeps({
        getCheckIn: vi.fn().mockResolvedValue(
          checkIn({ householdId: otherHouseholdId })
        )
      })
    );

    await expect(service.get(session, checkInId)).rejects.toBeInstanceOf(
      CheckInServiceError
    );
    await expect(service.get(session, checkInId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });
  });

  it("keeps generated summaries free of score and diagnosis language", () => {
    const summary = buildCheckInSummary({
      decisions: [
        {
          summary: "Alex owns meal planning until next review.",
          reviewOn: "2026-06-04T12:00:00.000Z"
        }
      ],
      deferredItems: ["Clarify morning handoff"],
      skippedItems: []
    });

    expect(containsUnsafeSummaryLanguage(summary)).toBe(false);
    expect(summary).not.toMatch(/score|winner|loser|diagnos/i);
  });

  it("rejects provided completion summaries with score-like labels", async () => {
    const service = createCheckInService(makeDeps());

    await expect(
      service.complete(session, checkInId, {
        completedAt: "2026-05-04T13:00:00.000Z",
        summary: "Winner score: Alex 10, Max 0."
      })
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
