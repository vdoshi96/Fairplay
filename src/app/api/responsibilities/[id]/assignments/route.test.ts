import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateAssignments = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    updateAssignments
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/responsibilities/${id}/assignments`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/responsibilities/[id]/assignments", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateAssignments.mockResolvedValue({
      id,
      currentAssignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ]
    });
  });

  it("passes handoff and revisit context for assignment changes", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        effectiveAt: "2026-05-08T12:00:00.000Z",
        handoffNotes: "Max has the plan.",
        revisitAt: "2026-05-22T12:00:00.000Z",
        assignments: [
          { personaKey: "max", role: "accountable_owner", scope: "outcome" }
        ]
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(200);
    expect(updateAssignments).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({
        handoffNotes: "Max has the plan.",
        revisitAt: "2026-05-22T12:00:00.000Z"
      })
    );
  });
});
