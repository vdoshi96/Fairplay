import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const get = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/check-ins/service")>();

  return {
    ...actual,
    checkInService: {
      get
    }
  };
});

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

const checkInId = "550e8400-e29b-41d4-a716-446655440080";

describe("/api/check-ins/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    get.mockResolvedValue({
      id: checkInId,
      state: "active",
      scheduledFor: null,
      facilitatorPersonaKey: "alex",
      items: []
    });
  });

  it("resumes an existing household check-in", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      new NextRequest(`http://localhost/api/check-ins/${checkInId}`),
      { params: Promise.resolve({ id: checkInId }) }
    );

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(session, checkInId);
  });
});
