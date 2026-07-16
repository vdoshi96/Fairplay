import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateOwnershipAgreement = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/responsibilities/service", () => ({
  responsibilityService: {
    updateOwnershipAgreement
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";
const expectedUpdatedAt = "2026-05-04T12:00:00.000Z";

function request(body: unknown) {
  return new NextRequest(
    `http://localhost/api/responsibilities/${id}/ownership-agreement`,
    {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "content-type": "application/json",
        cookie: "fairplay_session=raw-session-token"
      }
    }
  );
}

describe("POST /api/responsibilities/[id]/ownership-agreement", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateOwnershipAgreement.mockResolvedValue({
      id,
      nextReviewAt: "2026-08-01T12:00:00.000Z",
      currentAssignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ]
    });
  });

  it("validates and forwards the complete ownership agreement", async () => {
    const { POST } = await import("./route");
    const body = {
      responsibilityId: id,
      expectedUpdatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      reviewAt: "2026-08-01T12:00:00.000Z",
      handoffMode: "replace_former_owner",
      handoffNotes: "Max has the plan and timing."
    };

    const response = await POST(request(body), {
      params: Promise.resolve({ id })
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(
      expect.objectContaining({
        id,
        nextReviewAt: "2026-08-01T12:00:00.000Z"
      })
    );
    expect(updateOwnershipAgreement).toHaveBeenCalledWith(session, id, body);
  });

  it("rejects malformed or ownerless agreements before the service", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      request({
        responsibilityId: id,
        expectedUpdatedAt,
        expectedOwnerPersonaKeys: ["alex"],
        assignments: [
          { personaKey: "alex", role: "helper", scope: "support" }
        ],
        reviewAt: null
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(400);
    expect(updateOwnershipAgreement).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(
      request({
        responsibilityId: id,
        expectedUpdatedAt,
        expectedOwnerPersonaKeys: [],
        assignments: [
          { personaKey: "alex", role: "accountable_owner", scope: "outcome" }
        ],
        reviewAt: null
      }),
      { params: Promise.resolve({ id }) }
    );

    expect(response.status).toBe(401);
    expect(updateOwnershipAgreement).not.toHaveBeenCalled();
  });

  it("maps missing-persona and stale-agreement service errors", async () => {
    const { POST } = await import("./route");
    const body = {
      responsibilityId: id,
      expectedUpdatedAt,
      expectedOwnerPersonaKeys: ["alex"],
      assignments: [
        { personaKey: "max", role: "accountable_owner", scope: "outcome" }
      ],
      reviewAt: null,
      handoffMode: "replace_former_owner"
    };

    updateOwnershipAgreement.mockRejectedValueOnce({ code: "AUTH_REQUIRED" });
    const missingPersona = await POST(request(body), {
      params: Promise.resolve({ id })
    });
    expect(missingPersona.status).toBe(401);

    updateOwnershipAgreement.mockRejectedValueOnce({ code: "CONFLICT" });
    const staleAgreement = await POST(request(body), {
      params: Promise.resolve({ id })
    });
    expect(staleAgreement.status).toBe(409);
    expect(await staleAgreement.json()).toEqual({
      error: "Ownership agreement changed. Refresh and try again."
    });
  });
});
