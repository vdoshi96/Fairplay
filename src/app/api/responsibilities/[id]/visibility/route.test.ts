import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateVisibility = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    updateVisibility
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const context = { params: Promise.resolve({ id }) };

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/responsibilities/${id}/visibility`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/responsibilities/[id]/visibility", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateVisibility.mockResolvedValue({
      id,
      visibility: "partner_visible"
    });
  });

  it("applies a confirmed non-private visibility mutation", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        responsibilityId: id,
        fromVisibility: "shared_household",
        toVisibility: "partner_visible",
        confirmedVisibilityChange: true
      }),
      context
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateVisibility).toHaveBeenCalledWith(session, id, {
      responsibilityId: id,
      fromVisibility: "shared_household",
      toVisibility: "partner_visible",
      confirmedVisibilityChange: true
    });
    expect(body.visibility).toBe("partner_visible");
  });

  it("rejects private responsibility visibility", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        responsibilityId: id,
        fromVisibility: "shared_household",
        toVisibility: "private",
        confirmedVisibilityChange: true
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(updateVisibility).not.toHaveBeenCalled();
  });
});
