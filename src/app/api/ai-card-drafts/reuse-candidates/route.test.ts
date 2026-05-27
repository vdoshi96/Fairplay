import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const reuseCandidates = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    reuseCandidates
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function jsonRequest(body?: unknown) {
  return new NextRequest("http://localhost/api/ai-card-drafts/reuse-candidates", {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/ai-card-drafts/reuse-candidates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    reuseCandidates.mockResolvedValue({ candidates: [] });
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(jsonRequest({ inputText: "Dog medicine" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
    expect(reuseCandidates).not.toHaveBeenCalled();
  });

  it("searches reusable generated cards for the active session", async () => {
    const { POST } = await import("./route");

    const response = await POST(jsonRequest({ inputText: "Dog medicine" }));

    expect(response.status).toBe(200);
    expect(reuseCandidates).toHaveBeenCalledWith(session, {
      inputText: "Dog medicine"
    });
  });

  it("returns 400 for invalid search requests", async () => {
    const { POST } = await import("./route");

    const response = await POST(jsonRequest({ inputText: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid request." });
    expect(reuseCandidates).not.toHaveBeenCalled();
  });
});
