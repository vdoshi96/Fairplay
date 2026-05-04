import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const flagForRadar = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    flagForRadar
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/responsibilities/${id}/radar-flag`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/responsibilities/[id]/radar-flag", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    flagForRadar.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440050",
      responsibilityId: id,
      visibility: "shared_household"
    });
  });

  it("passes explicit shared-radar confirmation to the service", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        reasonKey: "review_due",
        visibility: "shared_household",
        confirmPublish: true,
        topic: "Review weekly meal outline"
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(201);
    expect(flagForRadar).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        reasonKey: "review_due",
        visibility: "shared_household",
        confirmPublish: true
      })
    );
  });
});
