import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentSession } from "@/server/auth/current-session";
import { distributeResponsibilityCard } from "./card-distribution";

const serviceMocks = vi.hoisted(() => ({
  get: vi.fn(),
  updateAssignments: vi.fn(),
  updateStatus: vi.fn()
}));

const repositoryMocks = vi.hoisted(() => ({
  updateResponsibilityBoardPlacement: vi.fn()
}));

vi.mock("./service", () => ({
  responsibilityService: serviceMocks
}));

vi.mock("@/server/repositories/responsibilities", () => repositoryMocks);

const session: CurrentSession = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001",
  createdAt: "2026-05-04T12:00:00.000Z",
  lastSeenAt: "2026-05-04T12:00:00.000Z",
  expiresAt: "2026-06-04T12:00:00.000Z",
  revokedAt: null,
  userAgentHash: null
};

function responsibility(overrides: Record<string, unknown> = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440010",
    status: "unassigned",
    currentAssignments: [],
    ...overrides
  };
}

describe("card distribution service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves an unassigned card to Alex ownership and placement together", async () => {
    serviceMocks.get.mockResolvedValue(
      responsibility({
        currentAssignments: [],
        status: "unassigned"
      })
    );
    serviceMocks.updateStatus.mockResolvedValue(undefined);
    serviceMocks.updateAssignments.mockResolvedValue(undefined);
    repositoryMocks.updateResponsibilityBoardPlacement.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440010",
      boardLane: "player_1",
      currentAssignments: [
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    });

    await distributeResponsibilityCard(session, {
      bucket: "alex",
      responsibilityId: "550e8400-e29b-41d4-a716-446655440010"
    });

    expect(serviceMocks.updateStatus).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      { status: "active" }
    );
    expect(serviceMocks.updateAssignments).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      expect.objectContaining({
        assignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ]
      })
    );
    expect(repositoryMocks.updateResponsibilityBoardPlacement).toHaveBeenCalledWith({
      actorPersonaId: session.selectedPersonaId,
      householdId: session.householdId,
      responsibilityId: "550e8400-e29b-41d4-a716-446655440010",
      sortOrder: 0,
      toLane: "player_1"
    });
  });

  it("clears ownership and pauses the card when saving it for later", async () => {
    serviceMocks.get.mockResolvedValue(
      responsibility({
        currentAssignments: [
          {
            personaKey: "max",
            role: "accountable_owner",
            scope: "outcome"
          }
        ],
        status: "active"
      })
    );
    serviceMocks.updateStatus.mockResolvedValue(undefined);
    serviceMocks.updateAssignments.mockResolvedValue(undefined);
    repositoryMocks.updateResponsibilityBoardPlacement.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440010",
      boardLane: "not_in_play",
      currentAssignments: []
    });

    await distributeResponsibilityCard(session, {
      bucket: "savedForLater",
      responsibilityId: "550e8400-e29b-41d4-a716-446655440010",
      sortOrder: 4
    });

    expect(serviceMocks.updateStatus).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      { status: "paused" }
    );
    expect(serviceMocks.updateAssignments).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      expect.objectContaining({
        assignments: [],
        handoffNotes: "Moved through card distribution.",
        revisitAt: expect.any(String)
      })
    );
    expect(repositoryMocks.updateResponsibilityBoardPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        sortOrder: 4,
        toLane: "not_in_play"
      })
    );
  });

  it("sends a board card back to the unclassified pool", async () => {
    serviceMocks.get.mockResolvedValue(
      responsibility({
        currentAssignments: [
          {
            personaKey: "alex",
            role: "accountable_owner",
            scope: "outcome"
          }
        ],
        status: "active"
      })
    );
    serviceMocks.updateStatus.mockResolvedValue(undefined);
    serviceMocks.updateAssignments.mockResolvedValue(undefined);
    repositoryMocks.updateResponsibilityBoardPlacement.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440010",
      boardLane: "cards_of_concern",
      currentAssignments: []
    });

    await distributeResponsibilityCard(session, {
      bucket: "unassigned",
      responsibilityId: "550e8400-e29b-41d4-a716-446655440010"
    });

    expect(serviceMocks.updateStatus).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      { status: "unassigned" }
    );
    expect(serviceMocks.updateAssignments).toHaveBeenCalledWith(
      session,
      "550e8400-e29b-41d4-a716-446655440010",
      expect.objectContaining({
        assignments: [],
        handoffNotes: "Moved through card distribution.",
        revisitAt: expect.any(String)
      })
    );
    expect(repositoryMocks.updateResponsibilityBoardPlacement).toHaveBeenCalledWith(
      expect.objectContaining({
        toLane: "cards_of_concern"
      })
    );
  });
});
