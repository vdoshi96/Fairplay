import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { SessionSummary } from "../repositories/sessions";

const cache = vi.hoisted(
  () =>
    (fn: (...args: unknown[]) => unknown) => {
      const results = new Map<string, unknown>();

      return (...args: unknown[]) => {
        const key = JSON.stringify(args);
        if (!results.has(key)) {
          results.set(key, fn(...args));
        }

        return results.get(key);
      };
    }
);
const findSessionByTokenHash = vi.fn();
const touchSessionActivity = vi.fn();

vi.mock("react", () => ({ cache }));

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
    vi.resetModules();
  });

  it("refreshes lastSeenAt once the five-minute activity window elapses", async () => {
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
      seenAt: now,
      lastSeenAtOrBefore: new Date("2026-05-04T11:55:00.000Z")
    });
    expect(result).toEqual(refreshedSession);
  });

  it("does not write lastSeenAt again inside five minutes", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const existingSession = session({
      lastSeenAt: "2026-05-04T11:55:00.001Z"
    });
    findSessionByTokenHash.mockResolvedValue(existingSession);
    const { getCurrentSession } = await import("./current-session");

    const result = await getCurrentSession(requestWithSession(), now);

    expect(result).toEqual(existingSession);
    expect(touchSessionActivity).not.toHaveBeenCalled();
  });

  it("resolves a session only once during one React server request", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    const existingSession = session({
      lastSeenAt: "2026-05-04T11:59:00.000Z"
    });
    findSessionByTokenHash.mockResolvedValue(existingSession);
    const { getCurrentSession } = await import("./current-session");
    const request = requestWithSession("one-request-token");

    const [first, second] = await Promise.all([
      getCurrentSession(request, now),
      getCurrentSession(request, now)
    ]);

    expect(first).toEqual(existingSession);
    expect(second).toEqual(existingSession);
    expect(findSessionByTokenHash).toHaveBeenCalledTimes(1);
    expect(touchSessionActivity).not.toHaveBeenCalled();
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

  it("rejects a session at its persisted expiry boundary", async () => {
    const now = new Date("2026-05-04T12:00:00.000Z");
    findSessionByTokenHash.mockResolvedValue(
      session({
        lastSeenAt: "2026-05-04T11:59:00.000Z",
        expiresAt: now.toISOString()
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
