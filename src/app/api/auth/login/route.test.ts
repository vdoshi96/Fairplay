import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findHouseholdByUsernameNormalized = vi.fn();
const createSessionForHousehold = vi.fn();
const getLoginThrottleState = vi.fn();
const recordLoginFailure = vi.fn();
const resetLoginThrottle = vi.fn();

vi.mock("@/server/repositories/households", () => ({
  findHouseholdByUsernameNormalized
}));

vi.mock("@/server/auth/sessions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/sessions")>();

  return {
    ...actual,
    createSessionForHousehold
  };
});

vi.mock("@/server/auth/throttle", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/throttle")>();

  return {
    ...actual,
    getLoginThrottleState,
    recordLoginFailure,
    resetLoginThrottle
  };
});

function loginRequest(password: string) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username: "Our Home",
      password
    }),
    headers: {
      "content-type": "application/json",
      "user-agent": "Vitest",
      "x-forwarded-for": "203.0.113.10"
    }
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    getLoginThrottleState.mockResolvedValue({ throttled: false });
    recordLoginFailure.mockResolvedValue(undefined);
    resetLoginThrottle.mockResolvedValue(undefined);
    const { hashPassword } = await import("@/server/auth/passwords");
    const password = await hashPassword("correct horse battery staple");
    findHouseholdByUsernameNormalized.mockResolvedValue({
      id: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
      name: "Our Home",
      timezone: "America/Chicago",
      credential: {
        passwordHash: password.passwordHash,
        hashAlgorithm: password.hashAlgorithm,
        hashParamsVersion: password.hashParamsVersion
      },
      personas: [
        {
          id: "56f3a328-af6d-4d1d-b8c7-603640126633",
          key: "alex",
          displayName: "Alex",
          avatarKey: "alex"
        },
        {
          id: "78ab59e8-c346-45a0-94ff-7519ee232b09",
          key: "max",
          displayName: "Max",
          avatarKey: "max"
        }
      ]
    });
    createSessionForHousehold.mockResolvedValue({
      rawToken: "raw-session-token",
      session: {
        id: "7c338d9d-33a8-4ac8-9e15-a3cb656bd6fa",
        householdId: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
        selectedPersonaId: null,
        createdAt: "2026-05-04T12:00:00.000Z",
        lastSeenAt: "2026-05-04T12:00:00.000Z",
        expiresAt: "2026-06-03T12:00:00.000Z",
        revokedAt: null,
        userAgentHash: null
      }
    });
  });

  it("sets a cookie and returns persona selection state on success", async () => {
    const { POST } = await import("./route");

    const response = await POST(loginRequest("correct horse battery staple"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(resetLoginThrottle).toHaveBeenCalled();
    expect(response.headers.get("set-cookie")).toContain("fairplay_session=");
    expect(body.requiresPersonaSelection).toBe(true);
  });

  it("uses a generic failure message for wrong passwords", async () => {
    const { POST } = await import("./route");

    const response = await POST(loginRequest("not the password"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(recordLoginFailure).toHaveBeenCalled();
    expect(body.error).toBe("Unable to log in with that username and password.");
  });

  it("throttles the sixth failed attempt for the same username and IP", async () => {
    getLoginThrottleState.mockResolvedValue({
      throttled: true,
      retryAfterSeconds: 900
    });
    const { POST } = await import("./route");

    const response = await POST(loginRequest("not the password"));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("900");
    expect(recordLoginFailure).not.toHaveBeenCalled();
    expect(body.error).toBe("Unable to log in with that username and password.");
  });
});
