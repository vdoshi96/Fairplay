import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionSummary } from "../repositories/sessions";

const findSessionByTokenHash = vi.fn();
const touchSessionActivity = vi.fn();

vi.mock("../repositories/sessions", () => ({
  findSessionByTokenHash,
  touchSessionActivity
}));

function requestWithSession(rawToken = "raw-session-token") {
  return new NextRequest("http://localhost/api/auth/me", {
    headers: {
      cookie: `fairplay_session=${rawToken}`
    }
  });
}

function session(overrides: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
    householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
    selectedPersonaId: "56f3a328-af6d-4d1d-b8c7-603640126633",
    createdAt: "2026-04-26T12:00:00.000Z",
    lastSeenAt: "2026-05-04T11:00:00.000Z",
    expiresAt: "2026-05-26T12:00:00.000Z",
    revokedAt: null,
    userAgentHash: null,
    ...overrides
  };
}

describe("getCurrentSession", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("refreshes lastSeenAt for an active authenticated session", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const existingSession = session();
    const refreshedSession = {
      ...existingSession,
      lastSeenAt: now.toISOString()
    };
    findSessionByTokenHash.mockResolvedValue(existingSession);
    touchSessionActivity.mockResolvedValue(refreshedSession);
    const { getCurrentSession } = await import("./current-session");

    const result = await getCurrentSession(requestWithSession(), now);

    expect(touchSessionActivity).toHaveBeenCalledWith({
      sessionId: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      seenAt: now
    });
    expect(result).toEqual(refreshedSession);
  });

  it("rejects an idle-expired session without refreshing activity", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    findSessionByTokenHash.mockResolvedValue(
      session({
        createdAt: "2026-04-26T12:00:00.000Z",
        lastSeenAt: "2026-04-26T11:59:59.999Z"
      })
    );
    const { getCurrentSession } = await import("./current-session");

    const result = await getCurrentSession(requestWithSession(), now);

    expect(result).toBeNull();
    expect(touchSessionActivity).not.toHaveBeenCalled();
  });

  it("rejects an absolute-expired session without refreshing activity", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    findSessionByTokenHash.mockResolvedValue(
      session({
        createdAt: "2026-04-03T12:00:00.000Z",
        lastSeenAt: "2026-05-04T11:00:00.000Z",
        expiresAt: "2026-06-03T12:00:00.000Z"
      })
    );
    const { getCurrentSession } = await import("./current-session");

    const result = await getCurrentSession(requestWithSession(), now);

    expect(result).toBeNull();
    expect(touchSessionActivity).not.toHaveBeenCalled();
  });

  it("rejects a revoked session without refreshing activity", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    findSessionByTokenHash.mockResolvedValue(
      session({
        revokedAt: "2026-05-04T11:30:00.000Z"
      })
    );
    const { getCurrentSession } = await import("./current-session");

    const result = await getCurrentSession(requestWithSession(), now);

    expect(result).toBeNull();
    expect(touchSessionActivity).not.toHaveBeenCalled();
  });
});
