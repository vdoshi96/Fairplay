import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const acceptReuseCandidate = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    acceptReuseCandidate
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

const candidateId = "550e8400-e29b-41d4-a716-446655440020";

function request() {
  return new NextRequest(
    `http://localhost/api/ai-card-drafts/reuse-candidates/${candidateId}/accept`,
    {
      method: "POST",
      headers: {
        cookie: "fairplay_session=raw-session-token"
      }
    }
  );
}

const context = {
  params: Promise.resolve({ id: candidateId })
};

describe("/api/ai-card-drafts/reuse-candidates/[id]/accept", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    acceptReuseCandidate.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440091",
      title: "Dog Medicine"
    });
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(request(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
    expect(acceptReuseCandidate).not.toHaveBeenCalled();
  });

  it("accepts a reusable generated card for the active session", async () => {
    const { POST } = await import("./route");

    const response = await POST(request(), context);

    expect(response.status).toBe(201);
    expect(acceptReuseCandidate).toHaveBeenCalledWith(session, candidateId);
  });

  it("returns 400 for invalid candidate ids", async () => {
    const { POST } = await import("./route");

    const response = await POST(request(), {
      params: Promise.resolve({ id: "not-a-uuid" })
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid request." });
    expect(acceptReuseCandidate).not.toHaveBeenCalled();
  });
});
