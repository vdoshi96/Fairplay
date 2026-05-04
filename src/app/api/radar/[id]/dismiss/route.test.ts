import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const dismiss = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/radar/service", () => ({
  radarService: {
    dismiss
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(body: unknown) {
  return new NextRequest(`http://localhost/api/radar/${id}/dismiss`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("POST /api/radar/[id]/dismiss", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    dismiss.mockResolvedValue({
      id,
      state: "dismissed",
      deferredUntil: null,
      resolvedAt: null,
      targetCheckInId: null
    });
  });

  it("dismisses radar items through the dedicated transition route", async () => {
    const { POST } = await import("./route");

    const response = await POST(request({ id }), { params: Promise.resolve({ id }) });

    expect(response.status).toBe(200);
    expect(dismiss).toHaveBeenCalledWith(
      session,
      id,
      expect.objectContaining({ id })
    );
  });
});
