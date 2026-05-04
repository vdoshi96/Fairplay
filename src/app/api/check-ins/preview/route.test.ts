import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const preview = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", () => ({
  checkInService: {
    preview
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(body?: unknown) {
  return new NextRequest("http://localhost/api/check-ins/preview", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/check-ins/preview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    preview.mockResolvedValue({
      items: [
        {
          id: "550e8400-e29b-41d4-a716-446655440090",
          itemType: "radar",
          state: "queued",
          promptKey: "radar_discussion",
          radarItemId: "550e8400-e29b-41d4-a716-446655440090",
          responsibilityId: null,
          sortOrder: 0,
          title: "Clarify morning handoff",
          description: "Shared household",
          visibility: "shared_household",
          response: null,
          decisionId: null
        }
      ]
    });
  });

  it("previews agenda suggestions without creating or resuming a check-in", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ maxItems: 5 }));

    expect(response.status).toBe(200);
    expect(preview).toHaveBeenCalledWith(session, { maxItems: 5 });
  });

  it("rejects agenda sizes above five", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ maxItems: 8 }));

    expect(response.status).toBe(400);
    expect(preview).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(request({ maxItems: 5 }));

    expect(response.status).toBe(401);
  });
});
