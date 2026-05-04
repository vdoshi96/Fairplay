import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const list = vi.fn();
const create = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    list,
    create
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(method: "GET" | "POST", body?: unknown) {
  return new NextRequest("http://localhost/api/radar", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/radar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    list.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        topic: "Clarify morning handoff",
        responsibilityId: null,
        reasonKey: "unclear_expectation",
        urgency: "normal",
        visibility: "private",
        state: "draft"
      }
    ]);
    create.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440011",
      topic: "Shared calendar snag",
      responsibilityId: null,
      reasonKey: "blocked",
      urgency: "soon",
      visibility: "shared_household",
      state: "open",
      notes: null,
      targetCheckInId: null,
      createdAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-05-04T12:00:00.000Z",
      resolvedAt: null
    });
  });

  it("lists persona-scoped radar items through the active session", async () => {
    const { GET } = await import("./route");

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith(session);
    expect(body[0]).toMatchObject({
      visibility: "private",
      state: "draft"
    });
  });

  it("creates radar items with topic, optional notes, responsibility, reason, urgency, and visibility", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request("POST", {
        topic: "Shared calendar snag",
        notes: null,
        responsibilityId: null,
        reasonKey: "blocked",
        urgency: "soon",
        visibility: "shared_household"
      })
    );

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      session,
      expect.objectContaining({
        topic: "Shared calendar snag",
        reasonKey: "blocked",
        visibility: "shared_household"
      })
    );
  });
});
