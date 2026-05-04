import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const publish = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    publish
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}/publish`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/radar/[id]/publish", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    publish.mockResolvedValue({
      id,
      visibility: "check_in_only",
      state: "open"
    });
  });

  it("passes explicit private draft confirmation to the service", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        id,
        fromVisibility: "private",
        visibility: "check_in_only",
        confirmPrivateDraftPublish: true
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(publish).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        fromVisibility: "private",
        visibility: "check_in_only",
        confirmPrivateDraftPublish: true
      })
    );
  });

  it("rejects private draft publish without confirmation before calling the service", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        id,
        fromVisibility: "private",
        visibility: "check_in_only",
        confirmPrivateDraftPublish: false
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(400);
    expect(publish).not.toHaveBeenCalled();
  });
});
