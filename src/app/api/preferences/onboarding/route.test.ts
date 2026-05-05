import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const getOnboardingPreferences = vi.fn();
const updateOnboardingPreferences = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/preferences", () => ({
  getOnboardingPreferences,
  updateOnboardingPreferences
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(method: "GET" | "PATCH", body?: unknown) {
  return new NextRequest("http://localhost/api/preferences/onboarding", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/preferences/onboarding", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    getOnboardingPreferences.mockResolvedValue({
      personaId: session.selectedPersonaId,
      welcomeDismissedAt: null,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 0,
      crashCourseReplayRequestedAt: null,
      updatedAt: "2026-05-04T12:00:00.000Z"
    });
    updateOnboardingPreferences.mockResolvedValue({
      personaId: session.selectedPersonaId,
      welcomeDismissedAt: "2026-05-04T12:00:00.000Z",
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null,
      crashCourseCurrentStep: 2,
      crashCourseReplayRequestedAt: null,
      updatedAt: "2026-05-04T12:00:00.000Z"
    });
  });

  it("gets onboarding preferences for the selected persona", async () => {
    const { GET } = await import("./route");

    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(getOnboardingPreferences).toHaveBeenCalledWith(
      session.selectedPersonaId
    );
  });

  it("updates onboarding preferences for the selected persona", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request("PATCH", {
        welcomeDismissedAt: "2026-05-04T12:00:00.000Z",
        crashCourseCurrentStep: 2
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateOnboardingPreferences).toHaveBeenCalledWith(
      session.selectedPersonaId,
      {
        welcomeDismissedAt: "2026-05-04T12:00:00.000Z",
        crashCourseCurrentStep: 2
      }
    );
    expect(body.crashCourseCurrentStep).toBe(2);
  });
});
