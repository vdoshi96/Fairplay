import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const createResponsibilityFromTemplate = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/card-templates", () => ({
  createResponsibilityFromTemplate
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(body: unknown) {
  return new NextRequest("http://localhost/api/responsibilities/from-template", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/responsibilities/from-template", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    createResponsibilityFromTemplate.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "Auto",
      boardLane: "player_1"
    });
  });

  it("creates a responsibility from a template scoped to the session household", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        templateId: "tpl_auto",
        lane: "player_1",
        titleOverride: "Car care"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createResponsibilityFromTemplate).toHaveBeenCalledWith({
      householdId: session.householdId,
      actorPersonaId: session.selectedPersonaId,
      templateId: "tpl_auto",
      lane: "player_1",
      titleOverride: "Car care"
    });
    expect(body.boardLane).toBe("player_1");
  });

  it("requires a selected persona", async () => {
    getCurrentSession.mockResolvedValue({ ...session, selectedPersonaId: null });
    const { POST } = await import("./route");

    const response = await POST(request({ templateId: "tpl_auto" }));

    expect(response.status).toBe(401);
    expect(createResponsibilityFromTemplate).not.toHaveBeenCalled();
  });
});
