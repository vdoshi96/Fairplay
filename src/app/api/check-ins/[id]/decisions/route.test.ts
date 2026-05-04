import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const recordDecision = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/check-ins/service")>();

  return {
    ...actual,
    checkInService: {
      recordDecision
    }
  };
});

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const checkInId = "550e8400-e29b-41d4-a716-446655440080";
const itemId = "550e8400-e29b-41d4-a716-446655440081";

describe("/api/check-ins/[id]/decisions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    recordDecision.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440082",
      decisionType: "assign_owner"
    });
  });

  it("records an explicit decision separately from item state updates", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest(`http://localhost/api/check-ins/${checkInId}/decisions`, {
        method: "POST",
        body: JSON.stringify({
          itemId,
          decisionType: "assign_owner",
          summary: "Alex owns meal planning until the next review.",
          effectiveAt: "2026-05-04T12:00:00.000Z",
          reviewOn: "2026-06-04T12:00:00.000Z",
          responsibilityId: "550e8400-e29b-41d4-a716-446655440070",
          responsibilityEffect: {
            kind: "assign_owner",
            assignments: [
              {
                personaKey: "alex",
                role: "accountable_owner",
                scope: "outcome"
              }
            ],
            handoffNotes: "Alex will outline the plan.",
            revisitAt: "2026-06-04T12:00:00.000Z"
          }
        }),
        headers: { "content-type": "application/json" }
      }),
      { params: Promise.resolve({ id: checkInId }) }
    );

    expect(response.status).toBe(201);
    expect(recordDecision).toHaveBeenCalledWith(
      session,
      checkInId,
      itemId,
      expect.objectContaining({ decisionType: "assign_owner" })
    );
  });
});
