import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateStatus = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    updateStatus
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/responsibilities/${id}/status`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/responsibilities/[id]/status", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateStatus.mockResolvedValue({
      id,
      status: "archived"
    });
  });

  it("passes archive confirmation to the service", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        status: "archived",
        confirmedArchive: true,
        note: "Keeping this for history."
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(updateStatus).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        status: "archived",
        confirmedArchive: true
      })
    );
  });
});
