import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const createOnboardingPreview = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai/diagnostics", () => ({
  createAiRequestDiagnostics: () => ({
    requestId: "fp_ai_preview_test",
    route: "/api/ai-card-drafts/onboarding-preview"
  })
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    createOnboardingPreview
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(body?: unknown) {
  return new NextRequest("http://localhost/api/ai-card-drafts/onboarding-preview", {
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    },
    method: "POST"
  });
}

describe("/api/ai-card-drafts/onboarding-preview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    createOnboardingPreview.mockResolvedValue({
      title: "Weekly backpack reset",
      summary: "Keep backpacks cleared, signed forms handled, and school items ready.",
      areaKeys: ["kids"],
      hiddenEffortKeys: ["noticing", "planning"],
      cadence: "weekly",
      definition: "Reset each backpack before the next school day.",
      conception: "Notice forms, supplies, and items that need attention.",
      planning: "Pick a reset window and place needed items nearby.",
      execution: "Empty the bag, handle papers, and repack essentials.",
      minimumStandard: "Backpacks are ready before school starts."
    });
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(request({ inputText: "Backpack reset" }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
    expect(createOnboardingPreview).not.toHaveBeenCalled();
  });

  it("returns a temporary generated preview from the user request", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({ inputText: "Make a card for the weekly backpack reset." })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(createOnboardingPreview).toHaveBeenCalledWith(
      session,
      { inputText: "Make a card for the weekly backpack reset." },
      {
        requestId: "fp_ai_preview_test",
        route: "/api/ai-card-drafts/onboarding-preview"
      }
    );
    expect(body).toMatchObject({
      title: "Weekly backpack reset",
      summary: "Keep backpacks cleared, signed forms handled, and school items ready.",
      definition: "Reset each backpack before the next school day."
    });
  });

  it("returns 400 for invalid preview requests", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ inputText: "" }));

    expect(response.status).toBe(400);
    expect(createOnboardingPreview).not.toHaveBeenCalled();
  });
});
