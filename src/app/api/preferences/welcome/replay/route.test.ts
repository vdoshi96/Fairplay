import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const replayWelcome = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/preferences", () => ({
  replayWelcome
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request() {
  return new NextRequest("http://localhost/api/preferences/welcome/replay", {
    method: "POST",
    headers: {
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/preferences/welcome/replay", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    replayWelcome.mockResolvedValue({
      personaId: session.selectedPersonaId,
      welcomeDismissedAt: null,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 2,
      crashCourseReplayRequestedAt: "2026-05-04T12:00:00.000Z",
      updatedAt: "2026-05-04T12:00:00.000Z"
    });
  });

  it("clears welcome dismissal for the selected persona", async () => {
    const { POST } = await import("./route");

    const response = await POST(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(replayWelcome).toHaveBeenCalledWith(session.selectedPersonaId);
    expect(body.welcomeDismissedAt).toBeNull();
  });

  it("requires a selected persona", async () => {
    getCurrentSession.mockResolvedValue({ ...session, selectedPersonaId: null });
    const { POST } = await import("./route");

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(replayWelcome).not.toHaveBeenCalled();
  });
});
