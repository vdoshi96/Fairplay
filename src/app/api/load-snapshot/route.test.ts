import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const listOverview = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    listOverview
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

describe("GET /api/load-snapshot", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    listOverview.mockResolvedValue({
      responsibilities: [],
      loadSnapshot: {
        ownerDistribution: { alex: 0, max: 0, unassigned: 0 },
        sharedDistribution: { shared: 0, solo: 0 },
        areaDistribution: {},
        cadenceDistribution: {},
        reviewDueCount: 0,
        radarOpenCount: 0,
        pausedOrNotRelevantCount: 0,
        hiddenEffortMix: {},
        periodStart: "2026-05-04T12:00:00.000Z",
        periodEnd: "2026-05-04T12:00:00.000Z",
        computedAt: "2026-05-04T12:00:00.000Z"
      }
    });
  });

  it("returns only aggregate snapshot data", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      new NextRequest("http://localhost/api/load-snapshot", {
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ownerDistribution).toEqual({ alex: 0, max: 0, unassigned: 0 });
    expect(JSON.stringify(body)).not.toMatch(/score|winner|loser|grade/i);
  });
});
