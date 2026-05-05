import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateResponsibilityBoardPlacement = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/responsibilities", () => ({
  updateResponsibilityBoardPlacement
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const context = { params: Promise.resolve({ id }) };

function request(body: unknown) {
  return new NextRequest(
    `http://localhost/api/responsibilities/${id}/board-placement`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        cookie: "fairplay_session=raw-session-token"
      }
    }
  );
}

describe("PATCH /api/responsibilities/[id]/board-placement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateResponsibilityBoardPlacement.mockResolvedValue({
      id,
      boardLane: "player_2",
      boardSortOrder: 3
    });
  });

  it("moves a responsibility card through the active session", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        toLane: "player_2",
        sortOrder: 3,
        note: "Max is taking point."
      }),
      context
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateResponsibilityBoardPlacement).toHaveBeenCalledWith({
      householdId: session.householdId,
      responsibilityId: id,
      toLane: "player_2",
      sortOrder: 3,
      actorPersonaId: session.selectedPersonaId,
      note: "Max is taking point."
    });
    expect(body.boardSortOrder).toBe(3);
  });

  it("rejects invalid placement payloads", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(request({ toLane: "player_2" }), context);

    expect(response.status).toBe(400);
    expect(updateResponsibilityBoardPlacement).not.toHaveBeenCalled();
  });
});
