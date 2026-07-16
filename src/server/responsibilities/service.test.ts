import { describe, expect, it, vi } from "vitest";

import type {
  ResponsibilityCreate,
  ResponsibilityDetail,
  ResponsibilitySummary
} from "@/contracts/responsibilities";
import type { CurrentSession } from "@/server/auth/current-session";
import {
  createResponsibilityService,
  ResponsibilityServiceError,
  type ReplaceActiveAssignmentsInput,
  type ResponsibilityServiceDeps
} from "./service";

const householdId = "550e8400-e29b-41d4-a716-446655440000";
const alexId = "550e8400-e29b-41d4-a716-446655440001";
const maxId = "550e8400-e29b-41d4-a716-446655440002";
const responsibilityId = "550e8400-e29b-41d4-a716-446655440010";

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

const personas = [
  { id: alexId, key: "alex" as const, displayName: "Alex" },
  { id: maxId, key: "max" as const, displayName: "Max" }
] as const;

function detail(
  overrides: Partial<ResponsibilityDetail> = {}
): ResponsibilityDetail {
  return {
    id: responsibilityId,
    title: "Weekly meal outline",
    summary: null,
    areaKeys: ["food_flow"],
    hiddenEffortKeys: ["planning"],
    cadence: "weekly",
    relevantDays: ["monday"],
    status: "active",
    visibility: "shared_household",
    boardLane: "cards_of_concern",
    boardSortOrder: 0,
    currentAssignments: [],
    nextReviewAt: null,
    householdStandard: null,
    notes: null,
    lifecycleNotes: null,
    lastReviewedAt: null,
    sourceDefinition: null,
    sourceConception: null,
    sourcePlanning: null,
    sourceExecution: null,
    sourceMinimumStandard: null,
    sourceCoverAssetPath: null,
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:00:00.000Z",
    archivedAt: null,
    ...overrides
  };
}

function summary(
  overrides: Partial<ResponsibilitySummary> = {}
): ResponsibilitySummary {
  const full = detail(overrides);

  return {
    id: full.id,
    title: full.title,
    areaKeys: full.areaKeys,
    hiddenEffortKeys: full.hiddenEffortKeys,
    cadence: full.cadence,
    relevantDays: full.relevantDays,
    status: full.status,
    visibility: full.visibility,
    boardLane: full.boardLane,
    boardSortOrder: full.boardSortOrder,
    currentAssignments: full.currentAssignments,
    nextReviewAt: full.nextReviewAt,
    sourceCoverAssetPath: full.sourceCoverAssetPath
  };
}

function makeDeps(
  overrides: Partial<ResponsibilityServiceDeps> = {}
): ResponsibilityServiceDeps {
  return {
    listPersonasForHousehold: vi.fn().mockResolvedValue(personas),
    createResponsibilityRecord: vi.fn().mockImplementation(async (input) =>
      detail({
        title: input.title,
        status: input.status,
        visibility: input.visibility,
        currentAssignments: input.currentAssignments ?? []
      })
    ),
    updateResponsibilityRecord: vi.fn().mockResolvedValue(detail()),
    getResponsibility: vi.fn().mockResolvedValue(detail()),
    listResponsibilities: vi.fn().mockResolvedValue([summary()]),
    replaceActiveAssignments: vi
      .fn()
      .mockImplementation(async (_input: ReplaceActiveAssignmentsInput) =>
      detail({
        currentAssignments: _input.assignments.map((assignment) => ({
          personaKey: assignment.personaKey,
          role: assignment.role,
          scope: assignment.scope
          }))
        })
      ),
    applyOwnershipAgreement: vi.fn().mockImplementation(async (input) =>
      detail({
        currentAssignments: input.assignments,
        nextReviewAt: input.reviewAt
      })
    ),
    createResponsibilityEvent: vi.fn().mockResolvedValue(undefined),
    ...overrides
  };
}

const createInput: ResponsibilityCreate = {
  title: "Weekly meal outline",
  summary: null,
  areaKeys: ["food_flow"],
  hiddenEffortKeys: ["planning"],
  cadence: "weekly",
  visibility: "shared_household",
  householdStandard: null,
  notes: null,
  nextReviewAt: null
};

describe("responsibility service", () => {
  it("creates responsibilities in the active household with unassigned/shared defaults", async () => {
    const deps = makeDeps();
    const service = createResponsibilityService(deps);

    await service.create(session, {
      ...createInput,
      visibility: undefined,
      status: undefined
    } as unknown as ResponsibilityCreate);

    expect(deps.createResponsibilityRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        createdByPersonaId: alexId,
        status: "unassigned",
        visibility: "shared_household"
      })
    );
  });

  it("creates an initially assigned responsibility without handoff context", async () => {
    const deps = makeDeps({
      createResponsibilityRecord: vi.fn().mockResolvedValue(
        detail({
          status: "active",
          currentAssignments: []
        })
      ),
      getResponsibility: vi.fn().mockResolvedValue(
        detail({
          currentAssignments: []
        })
      )
    });
    const service = createResponsibilityService(deps);

    await service.create(session, {
      ...createInput,
      currentAssignments: [
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });

    expect(deps.createResponsibilityRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active"
      })
    );
    expect(deps.replaceActiveAssignments).toHaveBeenCalled();
  });

  it("rejects private responsibility visibility in v1", async () => {
    const service = createResponsibilityService(makeDeps());

    await expect(
      service.create(session, {
        ...createInput,
        visibility: "private"
      } as unknown as ResponsibilityCreate)
    ).rejects.toMatchObject({
      code: "INVALID_INPUT"
    });
  });

  it("rejects reads and mutations outside the session household", async () => {
    const service = createResponsibilityService(
      makeDeps({
        getResponsibility: vi.fn().mockResolvedValue(null)
      })
    );

    await expect(service.get(session, responsibilityId)).rejects.toMatchObject({
      code: "NOT_FOUND"
    });

    await expect(
      service.updateStatus(session, responsibilityId, {
        status: "paused",
        note: "Pause for a calmer review."
      })
    ).rejects.toBeInstanceOf(ResponsibilityServiceError);
  });

  it("rejects owner changes on the legacy assignment path even with handoff context", async () => {
    const deps = makeDeps({
      getResponsibility: vi.fn().mockResolvedValue(
        detail({
          currentAssignments: [
            {
              personaKey: "alex",
              role: "accountable_owner",
              scope: "outcome"
            }
          ]
        })
      )
    });
    const service = createResponsibilityService(deps);

    await expect(
      service.updateAssignments(session, responsibilityId, {
        effectiveAt: "2026-05-08T12:00:00.000Z",
        handoffNotes: "Max has the next shop list and budget range.",
        revisitAt: "2026-05-22T12:00:00.000Z",
        assignments: [
          {
            personaKey: "max",
            role: "accountable_owner",
            scope: "outcome"
          }
        ]
      })
    ).rejects.toMatchObject({
      code: "INVALID_INPUT"
    });
    expect(deps.replaceActiveAssignments).not.toHaveBeenCalled();
    expect(deps.createResponsibilityEvent).not.toHaveBeenCalled();
  });

  it("keeps non-owner legacy assignment edits serialized against the owner set", async () => {
    const deps = makeDeps({
      getResponsibility: vi.fn().mockResolvedValue(
        detail({
          currentAssignments: [
            {
              personaKey: "alex",
              role: "accountable_owner",
              scope: "outcome"
            }
          ]
        })
      )
    });
    const service = createResponsibilityService(deps);

    await service.updateAssignments(session, responsibilityId, {
      effectiveAt: "2026-05-08T12:00:00.000Z",
      assignments: [
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        },
        {
          personaKey: "max",
          role: "helper",
          scope: "support"
        }
      ]
    });

    expect(deps.replaceActiveAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        responsibilityId,
        createdByPersonaId: alexId,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          {
            personaId: alexId,
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          },
          {
            personaId: maxId,
            personaKey: "max",
            role: "helper",
            scope: "support"
          }
        ]
      })
    );
    expect(deps.createResponsibilityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        responsibilityId,
        actorPersonaId: alexId,
        eventType: "assignment_changed",
        payload: expect.objectContaining({ handoffNotes: null, revisitAt: null })
      })
    );
  });

  it("routes ownership agreements through one atomic repository operation", async () => {
    const deps = makeDeps();
    const service = createResponsibilityService(deps);

    const result = await service.updateOwnershipAgreement(session, responsibilityId, {
      responsibilityId,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        {
          personaKey: "max",
          role: "accountable_owner",
          scope: "outcome"
        }
      ],
      reviewAt: "2026-08-01T12:00:00.000Z",
      handoffMode: "replace_former_owner",
      handoffNotes: "Max has the timing and supply context."
    });

    expect(deps.applyOwnershipAgreement).toHaveBeenCalledWith({
      householdId,
      responsibilityId,
      actorPersonaId: alexId,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        {
          personaKey: "max",
          role: "accountable_owner",
          scope: "outcome"
        }
      ],
      reviewAt: "2026-08-01T12:00:00.000Z",
      handoffMode: "replace_former_owner",
      handoffNotes: "Max has the timing and supply context."
    });
    expect(result).toMatchObject({
      currentAssignments: [
        {
          personaKey: "max",
          role: "accountable_owner",
          scope: "outcome"
        }
      ],
      nextReviewAt: "2026-08-01T12:00:00.000Z"
    });
    expect(deps.getResponsibility).not.toHaveBeenCalled();
    expect(deps.createResponsibilityEvent).not.toHaveBeenCalled();
  });

  it("rejects mismatched ownership agreement ids and requires a selected persona", async () => {
    const deps = makeDeps();
    const service = createResponsibilityService(deps);
    const input = {
      responsibilityId: "550e8400-e29b-41d4-a716-446655440011",
      expectedOwnerPersonaKeys: [],
      assignments: [
        {
          personaKey: "alex" as const,
          role: "accountable_owner" as const,
          scope: "outcome" as const
        }
      ],
      reviewAt: null
    };

    await expect(
      service.updateOwnershipAgreement(session, responsibilityId, input)
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });

    await expect(
      service.updateOwnershipAgreement(
        { ...session, selectedPersonaId: null },
        input.responsibilityId,
        input
      )
    ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
    expect(deps.applyOwnershipAgreement).not.toHaveBeenCalled();
  });

  it("returns load snapshot aggregate fields without scores or comparison labels", async () => {
    const ensureCatalogResponsibilities = vi.fn().mockResolvedValue(undefined);
    const service = createResponsibilityService(
      makeDeps({
        ensureCatalogResponsibilities,
        listResponsibilities: vi.fn().mockResolvedValue([
          summary({
            currentAssignments: [
              {
                personaKey: "alex",
                role: "accountable_owner",
                scope: "outcome"
              }
            ],
            nextReviewAt: "2026-05-01T00:00:00.000Z"
          }),
          summary({
            id: "550e8400-e29b-41d4-a716-446655440011",
            currentAssignments: [
              {
                personaKey: "max",
                role: "shared_owner",
                scope: "part"
              }
            ],
            status: "paused"
          })
        ])
      })
    );

    const overview = await service.listOverview(session, {
      asOf: "2026-05-04T12:00:00.000Z"
    });
    const serialized = JSON.stringify(overview.loadSnapshot);

    expect(ensureCatalogResponsibilities).toHaveBeenCalledWith({
      actorPersonaId: session.selectedPersonaId,
      householdId: session.householdId
    });
    expect(overview.loadSnapshot.ownerDistribution).toMatchObject({
      alex: 1,
      max: 1
    });
    expect(overview.loadSnapshot.reviewDueCount).toBe(1);
    expect(serialized).not.toMatch(/score|winner|loser|grade|diagnosis/i);
  });

  it("requires a selected persona before returning the load overview", async () => {
    const deps = makeDeps();
    const service = createResponsibilityService(deps);

    await expect(
      service.listOverview({
        ...session,
        selectedPersonaId: null
      })
    ).rejects.toMatchObject({
      code: "AUTH_REQUIRED"
    });
    expect(deps.listResponsibilities).not.toHaveBeenCalled();
  });

  it("records neutral status events through the dedicated status path", async () => {
    const deps = makeDeps({
      updateResponsibilityRecord: vi.fn().mockResolvedValue(
        detail({
          status: "paused",
          nextReviewAt: "2026-05-22T12:00:00.000Z"
        })
      )
    });
    const service = createResponsibilityService(deps);

    await service.updateStatus(session, responsibilityId, {
      status: "paused",
      note: "Pause until the new schedule is clear.",
      reviewOn: "2026-05-22T12:00:00.000Z"
    });

    expect(deps.updateResponsibilityRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        responsibilityId,
        status: "paused",
        nextReviewAt: "2026-05-22T12:00:00.000Z"
      })
    );
    expect(deps.createResponsibilityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        responsibilityId,
        actorPersonaId: alexId,
        eventType: "status_changed",
        payload: {
          status: "paused",
          note: "Pause until the new schedule is clear.",
          reviewOn: "2026-05-22T12:00:00.000Z"
        }
      })
    );
  });

  it("updates visibility through the dedicated confirmed path and rejects private responsibility visibility", async () => {
    const deps = makeDeps({
      updateResponsibilityRecord: vi.fn().mockResolvedValue(
        detail({
          visibility: "partner_visible"
        })
      ),
      getResponsibility: vi.fn().mockResolvedValue(
        detail({
          visibility: "shared_household"
        })
      )
    });
    const service = createResponsibilityService(deps);

    await service.updateVisibility(session, responsibilityId, {
      responsibilityId,
      fromVisibility: "shared_household",
      toVisibility: "partner_visible",
      confirmedVisibilityChange: true
    });

    expect(deps.updateResponsibilityRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        responsibilityId,
        visibility: "partner_visible"
      })
    );
    expect(deps.createResponsibilityEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "visibility_changed",
        payload: expect.objectContaining({
          fromVisibility: "shared_household",
          toVisibility: "partner_visible"
        })
      })
    );

    await expect(
      service.updateVisibility(session, responsibilityId, {
        responsibilityId,
        fromVisibility: "shared_household",
        toVisibility: "private",
        confirmedVisibilityChange: true
      })
    ).rejects.toMatchObject({
      code: "INVALID_INPUT"
    });
  });

  it("requires explicit confirmation before archiving", async () => {
    const service = createResponsibilityService(makeDeps());

    await expect(
      service.updateStatus(session, responsibilityId, {
        status: "archived"
      })
    ).rejects.toMatchObject({
      code: "INVALID_INPUT"
    });
  });

});
