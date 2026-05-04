import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthThrottle = vi.fn();
const recordFailedLoginAttempt = vi.fn();
const resetAuthThrottle = vi.fn();

vi.mock("../repositories/auth-throttle", () => ({
  getAuthThrottle,
  recordFailedLoginAttempt,
  resetAuthThrottle
}));

describe("login throttling", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    recordFailedLoginAttempt.mockResolvedValue(undefined);
    resetAuthThrottle.mockResolvedValue(undefined);
  });

  it("starts a fresh failure window after the prior window expires", async () => {
    getAuthThrottle.mockResolvedValue({
      usernameNormalized: "our-home",
      ipHash: "ip-hash",
      failedAttemptCount: 5,
      windowStartedAt: "2026-05-04T12:00:00.000Z",
      throttledUntil: null,
      lastAttemptAt: "2026-05-04T12:05:00.000Z"
    });
    const { recordLoginFailure } = await import("./throttle");

    await recordLoginFailure({
      usernameNormalized: "our-home",
      ipHash: "ip-hash",
      now: new Date("2026-05-04T12:16:00.000Z")
    });

    expect(resetAuthThrottle).toHaveBeenCalledWith({
      usernameNormalized: "our-home",
      ipHash: "ip-hash"
    });
    expect(recordFailedLoginAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        usernameNormalized: "our-home",
        ipHash: "ip-hash",
        throttleAfterAttempts: 5,
        throttleForMs: 15 * 60 * 1000
      })
    );
  });
});
