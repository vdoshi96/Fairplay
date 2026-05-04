import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const schedule = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    schedule
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const targetCheckInId = "550e8400-e29b-41d4-a716-446655440080";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}/schedule`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/radar/[id]/schedule", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    schedule.mockResolvedValue({
      id,
      state: "scheduled",
      targetCheckInId
    });
  });

  it("attaches a radar item to a check-in", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        targetCheckInId
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(schedule).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({ targetCheckInId })
    );
  });

  it("allows a check-in-ready placeholder when no check-in exists yet", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        targetCheckInId: null
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(schedule).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({ targetCheckInId: null })
    );
  });
});
