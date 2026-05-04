import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const selectSessionPersona = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/sessions", () => ({
  selectSessionPersona
}));

function selectRequest(personaId: string) {
  return new NextRequest("http://localhost/api/personas/select", {
    method: "POST",
    body: JSON.stringify({ personaId }),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/personas/select", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue({
      id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      selectedPersonaId: null,
      createdAt: "2026-05-04T12:00:00.000Z",
      lastSeenAt: "2026-05-04T12:00:00.000Z",
      expiresAt: "2026-06-03T12:00:00.000Z",
      revokedAt: null,
      userAgentHash: null
    });
  });

  it("rejects a persona id from another household", async () => {
    const { RepositoryError } = await import("@/server/db/errors");
    selectSessionPersona.mockRejectedValue(
      new RepositoryError("INVALID_INPUT", "Persona does not belong to household.")
    );
    const { POST } = await import("./route");

    const response = await POST(selectRequest("78ab59e8-c346-45a0-94ff-7519ee232b09"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(selectSessionPersona).toHaveBeenCalledWith({
      sessionId: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      selectedPersonaId: "78ab59e8-c346-45a0-94ff-7519ee232b09"
    });
    expect(body.error).toBe("Persona is not available for this household.");
  });
});
