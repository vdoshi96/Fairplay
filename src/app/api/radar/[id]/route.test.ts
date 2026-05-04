import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const get = vi.fn();
const update = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    get,
    update
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const context = { params: Promise.resolve({ id }) };

function request(method: "GET" | "PATCH", body?: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/radar/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    get.mockResolvedValue({
      id,
      topic: "Clarify morning handoff",
      visibility: "private"
    });
    update.mockResolvedValue({
      id,
      topic: "Clarify school morning plan",
      visibility: "private"
    });
  });

  it("returns radar detail through the active session", async () => {
    const { GET } = await import("./route");

    const response = await GET(request("GET"), context);

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(session, id);
  });

  it("updates editable radar fields through the active session", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request("PATCH", {
        topic: "Clarify school morning plan",
        notes: null,
        reasonKey: "handoff_needed",
        urgency: "soon",
        state: "dismissed"
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        topic: "Clarify school morning plan",
        state: "dismissed"
      })
    );
  });

  it("rejects visibility changes in the general edit path", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request("PATCH", {
        visibility: "shared_household"
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
