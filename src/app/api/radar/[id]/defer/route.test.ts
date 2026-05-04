import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const defer = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    defer
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}/defer`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/radar/[id]/defer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    defer.mockResolvedValue({
      id,
      state: "deferred"
    });
  });

  it("defers radar items with an optional revisit date", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        id,
        deferredUntil: "2026-05-11T12:00:00.000Z",
        note: "Return when the week is lighter."
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(defer).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        deferredUntil: "2026-05-11T12:00:00.000Z"
      })
    );
  });
});
