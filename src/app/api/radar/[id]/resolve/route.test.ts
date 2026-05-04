import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const resolve = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    resolve
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const resolvedAt = "2026-05-12T12:00:00.000Z";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/radar/[id]/resolve", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    resolve.mockResolvedValue({
      id,
      state: "resolved",
      resolvedAt
    });
  });

  it("resolves radar items with an explicit resolved timestamp", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        id,
        resolvedAt,
        note: "Expectation is clear enough for now."
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(resolve).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        resolvedAt
      })
    );
  });
});
