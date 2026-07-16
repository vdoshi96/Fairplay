import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentSession } from "@/server/auth/current-session";
import { distributeResponsibilityCard } from "./card-distribution";

const repositoryMocks = vi.hoisted(() => ({
  applyResponsibilityCardDistribution: vi.fn()
}));

vi.mock("@/server/repositories/responsibilities", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/server/repositories/responsibilities")
  >()),
  ...repositoryMocks
}));

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

const responsibilityId = "550e8400-e29b-41d4-a716-446655440010";

describe("card distribution service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("moves an unassigned card to Alex through one atomic repository mutation", async () => {
    const moved = {
      id: responsibilityId,
      boardLane: "player_1",
      currentAssignments: [
        {
          personaKey: "alex",
          role: "accountable_owner",
          scope: "outcome"
        }
      ]
    };
    repositoryMocks.applyResponsibilityCardDistribution.mockResolvedValue(moved);

    const result = await distributeResponsibilityCard(session, {
      bucket: "alex",
      responsibilityId
    });

    expect(result).toBe(moved);
    expect(repositoryMocks.applyResponsibilityCardDistribution).toHaveBeenCalledOnce();
    expect(repositoryMocks.applyResponsibilityCardDistribution).toHaveBeenCalledWith({
      actorPersonaId: session.selectedPersonaId,
      handoffNotes: "Moved through card distribution.",
      householdId: session.householdId,
      responsibilityId,
      sortOrder: 0,
      status: "active",
      targetOwnerPersonaKey: "alex",
      toLane: "player_1"
    });
  });

  it("clears ownership and pauses the card when saving it for later", async () => {
    repositoryMocks.applyResponsibilityCardDistribution.mockResolvedValue({
      id: responsibilityId,
      boardLane: "not_in_play",
      currentAssignments: []
    });

    await distributeResponsibilityCard(session, {
      bucket: "savedForLater",
      responsibilityId,
      sortOrder: 4
    });

    expect(repositoryMocks.applyResponsibilityCardDistribution).toHaveBeenCalledWith(
      expect.objectContaining({
        handoffNotes: "Moved through card distribution.",
        sortOrder: 4,
        status: "paused",
        targetOwnerPersonaKey: null,
        toLane: "not_in_play"
      })
    );
  });

  it("supports Undo by sending a board card back to the unclassified pool", async () => {
    repositoryMocks.applyResponsibilityCardDistribution.mockResolvedValue({
      id: responsibilityId,
      boardLane: "cards_of_concern",
      currentAssignments: []
    });

    await distributeResponsibilityCard(session, {
      bucket: "unassigned",
      responsibilityId
    });

    expect(repositoryMocks.applyResponsibilityCardDistribution).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "unassigned",
        targetOwnerPersonaKey: null,
        toLane: "cards_of_concern"
      })
    );
  });

  it("requires a selected persona before any mutation begins", async () => {
    await expect(
      distributeResponsibilityCard(
        {
          ...session,
          selectedPersonaId: null
        },
        {
          bucket: "alex",
          responsibilityId
        }
      )
    ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });

    expect(repositoryMocks.applyResponsibilityCardDistribution).not.toHaveBeenCalled();
  });
});
