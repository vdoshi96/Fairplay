import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const get = vi.fn();
const update = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
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

function request(body?: unknown) {
  return new NextRequest(`http://localhost/api/responsibilities/${id}`, {
    method: body ? "PATCH" : "GET",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/responsibilities/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    get.mockResolvedValue({ id, title: "Weekly meal outline" });
    update.mockResolvedValue({ id, title: "Updated outline" });
  });

  it("returns detail through the active session", async () => {
    const { GET } = await import("./route");

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(session, id);
  });

  it("edits responsibility fields through the active session", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        title: "Updated outline",
        relevantDays: ["monday", "friday"],
        nextReviewAt: "2026-05-20T12:00:00.000Z"
      }),
      context
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        title: "Updated outline",
        relevantDays: ["monday", "friday"]
      })
    );
    expect(body.title).toBe("Updated outline");
  });

  it("rejects visibility in the general edit path", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({
        title: "Updated outline",
        visibility: "partner_visible"
      }),
      context
    );

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});
