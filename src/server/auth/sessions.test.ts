import { describe, expect, it, vi } from "vitest";

import {
  SESSION_ABSOLUTE_EXPIRATION_MS,
  createSessionForHousehold,
  hashSessionToken
} from "./sessions";

describe("session token persistence", () => {
  it("persists only a hash of the raw session token", async () => {
    const repository = {
      createSession: vi.fn(async (input) => ({
        id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
        householdId: input.householdId,
        selectedPersonaId: null,
        createdAt: "2026-05-04T12:00:00.000Z",
        lastSeenAt: "2026-05-04T12:00:00.000Z",
        expiresAt: input.expiresAt.toISOString(),
        revokedAt: null,
        userAgentHash: input.userAgentHash
      }))
    };
    const now = new Date("2026-05-04T12:00:00.000Z");

    const result = await createSessionForHousehold({
      householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      now,
      repository,
      userAgent: "Vitest"
    });

    const persisted = repository.createSession.mock.calls[0][0];
    expect(result.rawToken).toHaveLength(43);
    expect(persisted.tokenHash).not.toBe(result.rawToken);
    expect(persisted.tokenHash).toBe(hashSessionToken(result.rawToken));
    expect(persisted.expiresAt.toISOString()).toBe(
      new Date(now.getTime() + SESSION_ABSOLUTE_EXPIRATION_MS).toISOString()
    );
  });
});
