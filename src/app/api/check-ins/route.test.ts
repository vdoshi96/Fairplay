import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const create = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", () => ({
  checkInService: {
    create
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(body?: unknown) {
  return new NextRequest("http://localhost/api/check-ins", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/check-ins", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    create.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440080",
      state: "active",
      scheduledFor: null,
      facilitatorPersonaKey: "alex",
      items: []
    });
  });

  it("creates a scheduled check-in for the active session", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({ scheduledFor: "2026-05-20T23:30:00.000Z" })
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(session, {
      scheduledFor: "2026-05-20T23:30:00.000Z"
    });
  });

  it("rejects agenda sizes above five", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ maxItems: 8 }));

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(request({ maxItems: 5 }));

    expect(response.status).toBe(401);
  });
});
