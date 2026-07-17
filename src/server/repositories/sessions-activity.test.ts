import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMany = vi.hoisted(() => vi.fn());
const findFirst = vi.hoisted(() => vi.fn());

vi.mock("../db/prisma", () => ({
  prisma: {
    session: {
      updateMany,
      findFirst
    }
  }
}));

import { touchSessionActivity } from "./sessions";

function persistedSession(lastSeenAt: string) {
  return {
    id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
    householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
    selectedPersonaId: "56f3a328-af6d-4d1d-b8c7-603640126633",
    tokenHash: "opaque-token-hash",
    createdAt: new Date("2026-05-01T12:00:00.000Z"),
    lastSeenAt: new Date(lastSeenAt),
    expiresAt: new Date("2026-05-31T12:00:00.000Z"),
    revokedAt: null,
    userAgentHash: null
  };
}

describe("touchSessionActivity", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("conditionally writes only when activity is at least five minutes old", async () => {
    updateMany.mockResolvedValue({ count: 1 });
    findFirst.mockResolvedValue(persistedSession("2026-05-04T12:00:00.000Z"));

    const result = await touchSessionActivity({
      sessionId: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      seenAt: "2026-05-04T12:00:00.000Z",
      lastSeenAtOrBefore: "2026-05-04T11:55:00.000Z"
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
        householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
        revokedAt: null,
        lastSeenAt: {
          lte: new Date("2026-05-04T11:55:00.000Z")
        }
      },
      data: {
        lastSeenAt: new Date("2026-05-04T12:00:00.000Z")
      }
    });
    expect(result?.lastSeenAt).toBe("2026-05-04T12:00:00.000Z");
  });

  it("returns the latest session when another request already refreshed it", async () => {
    updateMany.mockResolvedValue({ count: 0 });
    findFirst.mockResolvedValue(persistedSession("2026-05-04T11:59:59.000Z"));

    const result = await touchSessionActivity({
      sessionId: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      seenAt: "2026-05-04T12:00:00.000Z",
      lastSeenAtOrBefore: "2026-05-04T11:55:00.000Z"
    });

    expect(result?.lastSeenAt).toBe("2026-05-04T11:59:59.000Z");
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
        householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb"
      }
    });
  });
});
