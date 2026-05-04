import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const revokeSession = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/sessions", () => ({
  revokeSession
}));

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue({
      id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      selectedPersonaId: "56f3a328-af6d-4d1d-b8c7-603640126633",
      createdAt: "2026-05-04T12:00:00.000Z",
      lastSeenAt: "2026-05-04T12:00:00.000Z",
      expiresAt: "2026-06-03T12:00:00.000Z",
      revokedAt: null,
      userAgentHash: null
    });
    revokeSession.mockResolvedValue(undefined);
  });

  it("revokes the active session and clears the session cookie", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new NextRequest("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(revokeSession).toHaveBeenCalledWith({
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      sessionId: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa"
    });
    expect(response.headers.get("set-cookie")).toContain("fairplay_session=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
