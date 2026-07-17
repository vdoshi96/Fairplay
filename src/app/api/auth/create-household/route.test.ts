import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const consumeHouseholdCreationAttempt = vi.fn();
const createHouseholdWithPersonas = vi.fn();
const createSessionForHousehold = vi.fn();
const hashPassword = vi.fn();
const readBoundedJsonBody = vi.fn();

vi.mock("@/server/auth/household-creation-rate-limit", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/server/auth/household-creation-rate-limit")
  >();

  return {
    ...actual,
    consumeHouseholdCreationAttempt
  };
});

vi.mock("@/server/auth/passwords", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/passwords")>();

  return {
    ...actual,
    hashPassword
  };
});

vi.mock("@/server/auth/request-body-limit", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/server/auth/request-body-limit")
  >();

  return {
    ...actual,
    readBoundedJsonBody
  };
});

vi.mock("@/server/repositories/households", () => ({
  createHouseholdWithPersonas
}));

vi.mock("@/server/auth/sessions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/auth/sessions")>();

  return {
    ...actual,
    createSessionForHousehold
  };
});

const validPayload = {
  householdName: "Our Home",
  username: "Our_Home",
  password: "correct horse battery staple",
  timezone: "America/Chicago"
};

afterEach(() => {
  vi.restoreAllMocks();
});

function rawRequest(body: string, headers: Record<string, string> = {}) {
  return new NextRequest("http://localhost/api/auth/create-household", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "user-agent": "Vitest",
      "x-forwarded-for": "203.0.113.10",
      ...headers
    }
  });
}

function request(body: unknown) {
  return rawRequest(JSON.stringify(body));
}

describe("POST /api/auth/create-household", () => {
  beforeEach(async () => {
    vi.resetAllMocks();
    const actualBodyLimit = await vi.importActual<
      typeof import("@/server/auth/request-body-limit")
    >("@/server/auth/request-body-limit");
    readBoundedJsonBody.mockImplementation(actualBodyLimit.readBoundedJsonBody);
    consumeHouseholdCreationAttempt.mockReturnValue({ allowed: true });
    hashPassword.mockResolvedValue({
      passwordHash: "$argon2id$test-password-hash",
      hashAlgorithm: "argon2id",
      hashParamsVersion: "v1"
    });
    createHouseholdWithPersonas.mockResolvedValue({
      household: {
        id: "68d8178b-a0ab-4f6e-a367-5308be369dbb",
        name: "Our Home",
        timezone: "America/Chicago"
      },
      personas: [
        {
          id: "56f3a328-af6d-4d1d-b8c7-603640126633",
          key: "alex",
          displayName: "Alex"
        },
        {
          id: "78ab59e8-c346-45a0-94ff-7519ee232b09",
          key: "max",
          displayName: "Max"
        }
      ],
      requiresPersonaSelection: true
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

  it("checks the limiter and bounded body before hashing or creating a household", async () => {
    const { POST } = await import("./route");

    const response = await POST(request(validPayload));
    const body = await response.json();
    const persisted = createHouseholdWithPersonas.mock.calls[0][0];

    expect(response.status).toBe(201);
    expect(consumeHouseholdCreationAttempt).toHaveBeenCalledTimes(1);
    expect(readBoundedJsonBody).toHaveBeenCalledTimes(1);
    expect(hashPassword).toHaveBeenCalledWith(validPayload.password);
    expect(
      consumeHouseholdCreationAttempt.mock.invocationCallOrder[0]
    ).toBeLessThan(readBoundedJsonBody.mock.invocationCallOrder[0]);
    expect(readBoundedJsonBody.mock.invocationCallOrder[0]).toBeLessThan(
      hashPassword.mock.invocationCallOrder[0]
    );
    expect(hashPassword.mock.invocationCallOrder[0]).toBeLessThan(
      createHouseholdWithPersonas.mock.invocationCallOrder[0]
    );
    expect(persisted.usernameNormalized).toBe("our-home");
    expect(persisted.passwordHash).not.toBe(validPayload.password);
    expect(persisted.passwordHash).toContain("$argon2id$");
    expect(persisted.hashAlgorithm).toBe("argon2id");
    expect(persisted.hashParamsVersion).toBe("v1");
    expect(response.headers.get("set-cookie")).toContain("fairplay_session=");
    expect(JSON.stringify(body)).not.toContain("password");
    expect(JSON.stringify(body)).not.toContain("argon2");
    expect(body.requiresPersonaSelection).toBe(true);
  });

  it("rejects an oversized declared body before parsing, hashing, or database work", async () => {
    const parse = vi.spyOn(JSON, "parse");
    const { POST } = await import("./route");

    const response = await POST(
      rawRequest(JSON.stringify(validPayload), { "content-length": "8193" })
    );
    const responseText = await response.text();

    expect(response.status).toBe(413);
    expect(parse).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(createHouseholdWithPersonas).not.toHaveBeenCalled();
    expect(responseText).not.toContain(validPayload.password);
  });

  it("rejects an oversized streamed body even when Content-Length understates it", async () => {
    const oversizedSecret = `secret-${"x".repeat(9_000)}`;
    const { POST } = await import("./route");

    const response = await POST(
      rawRequest(
        JSON.stringify({
          ...validPayload,
          password: oversizedSecret
        }),
        { "content-length": "1" }
      )
    );
    const responseText = await response.text();

    expect(response.status).toBe(413);
    expect(hashPassword).not.toHaveBeenCalled();
    expect(createHouseholdWithPersonas).not.toHaveBeenCalled();
    expect(responseText).not.toContain(oversizedSecret);
  });

  it("returns a safe generic error for invalid JSON without hashing or database work", async () => {
    const malformedSecret = "do-not-echo-this-secret";
    const { POST } = await import("./route");

    const response = await POST(rawRequest(`{\"password\":\"${malformedSecret}\"`));
    const responseText = await response.text();

    expect(response.status).toBe(400);
    expect(responseText).toContain("Invalid request.");
    expect(responseText).not.toContain(malformedSecret);
    expect(hashPassword).not.toHaveBeenCalled();
    expect(createHouseholdWithPersonas).not.toHaveBeenCalled();
  });

  it("rate limits before reading the password and returns deterministic retry guidance", async () => {
    consumeHouseholdCreationAttempt.mockReturnValue({
      allowed: false,
      retryAfterSeconds: 321
    });
    const { POST } = await import("./route");

    const response = await POST(request(validPayload));
    const responseText = await response.text();

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("321");
    expect(responseText).toContain("Unable to create a household right now.");
    expect(responseText).not.toContain(validPayload.password);
    expect(readBoundedJsonBody).not.toHaveBeenCalled();
    expect(hashPassword).not.toHaveBeenCalled();
    expect(createHouseholdWithPersonas).not.toHaveBeenCalled();
  });

  it("returns conflict for a duplicate username without echoing the password", async () => {
    const { RepositoryError } = await import("@/server/db/errors");
    createHouseholdWithPersonas.mockRejectedValue(
      new RepositoryError("CONFLICT", "duplicate")
    );
    const { POST } = await import("./route");

    const response = await POST(request(validPayload));
    const responseText = await response.text();

    expect(response.status).toBe(409);
    expect(responseText).toContain("Username unavailable.");
    expect(responseText).not.toContain(validPayload.password);
  });
});
