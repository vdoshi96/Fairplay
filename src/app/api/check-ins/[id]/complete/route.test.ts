import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const complete = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/check-ins/service")>();

  return {
    ...actual,
    checkInService: {
      complete
    }
  };
});

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const checkInId = "550e8400-e29b-41d4-a716-446655440080";

describe("/api/check-ins/[id]/complete", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    complete.mockResolvedValue({
      id: checkInId,
      state: "completed",
      completedAt: "2026-05-04T13:00:00.000Z",
      summary: "Decisions: Review the meal plan in June."
    });
  });

  it("completes a check-in with persisted summary text", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new NextRequest(`http://localhost/api/check-ins/${checkInId}/complete`, {
        method: "POST",
        body: JSON.stringify({ completedAt: "2026-05-04T13:00:00.000Z" }),
        headers: { "content-type": "application/json" }
      }),
      { params: Promise.resolve({ id: checkInId }) }
    );

    expect(response.status).toBe(200);
    expect(complete).toHaveBeenCalledWith(session, checkInId, {
      completedAt: "2026-05-04T13:00:00.000Z"
    });
  });
});
