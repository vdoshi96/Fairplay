import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const getLittleAlexPreferences = vi.fn();
const updateLittleAlexPreferences = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/preferences", () => ({
  getLittleAlexPreferences,
  updateLittleAlexPreferences
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(method: "GET" | "PATCH", body?: unknown) {
  return new NextRequest("http://localhost/api/preferences/little-alex", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/preferences/little-alex", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    getLittleAlexPreferences.mockResolvedValue({
      personaId: session.selectedPersonaId,
      genderPresentation: "neutral",
      chatPhrase: "Help!",
      skinTone: "tone_2",
      hairColor: "dark_brown",
      updatedAt: "2026-05-06T12:00:00.000Z"
    });
    updateLittleAlexPreferences.mockResolvedValue({
      personaId: session.selectedPersonaId,
      genderPresentation: "feminine",
      chatPhrase: "hello from alex",
      skinTone: "tone_4",
      hairColor: "blonde",
      updatedAt: "2026-05-06T12:00:00.000Z"
    });
  });

  it("gets Little Alex preferences for the selected persona", async () => {
    const { GET } = await import("./route");

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getLittleAlexPreferences).toHaveBeenCalledWith(
      session.selectedPersonaId
    );
    expect(body.chatPhrase).toBe("Help!");
  });

  it("updates Little Alex preferences for the selected persona", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request("PATCH", {
        genderPresentation: "feminine",
        chatPhrase: "hello from alex",
        skinTone: "tone_4",
        hairColor: "blonde"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateLittleAlexPreferences).toHaveBeenCalledWith(
      session.selectedPersonaId,
      {
        genderPresentation: "feminine",
        chatPhrase: "hello from alex",
        skinTone: "tone_4",
        hairColor: "blonde"
      }
    );
    expect(body.skinTone).toBe("tone_4");
    expect(body.hairColor).toBe("blonde");
  });

  it("rejects invalid Little Alex phrases", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request("PATCH", {
        chatPhrase: "this phrase is definitely longer than thirty characters"
      })
    );

    expect(response.status).toBe(400);
    expect(updateLittleAlexPreferences).not.toHaveBeenCalled();
  });

  it("requires a selected persona", async () => {
    getCurrentSession.mockResolvedValueOnce({ ...session, selectedPersonaId: null });
    const { GET } = await import("./route");

    const response = await GET(request("GET"));

    expect(response.status).toBe(401);
    expect(getLittleAlexPreferences).not.toHaveBeenCalled();
  });
});
