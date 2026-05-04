import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const listOverview = vi.fn();
const create = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    listOverview,
    create
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(method: string, body?: unknown) {
  return new NextRequest("http://localhost/api/responsibilities", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("/api/responsibilities", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    listOverview.mockResolvedValue({
      responsibilities: [],
      loadSnapshot: {
        periodStart: "2026-05-04T12:00:00.000Z",
        periodEnd: "2026-05-04T12:00:00.000Z",
        computedAt: "2026-05-04T12:00:00.000Z",
        ownerDistribution: { alex: 0, max: 0, unassigned: 0 },
        sharedDistribution: { shared: 0, solo: 0 },
        areaDistribution: {},
        cadenceDistribution: {},
        reviewDueCount: 0,
        radarOpenCount: 0,
        pausedOrNotRelevantCount: 0,
        hiddenEffortMix: {}
      }
    });
    create.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "Weekly meal outline"
    });
  });

  it("lists overview for the active session household", async () => {
    const { GET } = await import("./route");

    const response = await GET(request("GET"));

    expect(response.status).toBe(200);
    expect(listOverview).toHaveBeenCalledWith(session);
  });

  it("creates a responsibility through the active session", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request("POST", {
        title: "Weekly meal outline",
        areaKeys: ["food_flow"],
        hiddenEffortKeys: ["planning"],
        cadence: "weekly",
        visibility: "shared_household"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      session,
      expect.objectContaining({
        title: "Weekly meal outline",
        visibility: "shared_household"
      })
    );
    expect(body.title).toBe("Weekly meal outline");
  });

  it("rejects unauthenticated requests", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
  });

  it("returns auth required when overview needs a selected persona", async () => {
    getCurrentSession.mockResolvedValue({
      ...session,
      selectedPersonaId: null
    });
    listOverview.mockRejectedValue({
      code: "AUTH_REQUIRED"
    });
    const { GET } = await import("./route");

    const response = await GET(request("GET"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe("Authentication required.");
  });
});
