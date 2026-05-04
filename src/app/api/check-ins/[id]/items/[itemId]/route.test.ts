import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const updateItem = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/check-ins/service", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/check-ins/service")>();

  return {
    ...actual,
    checkInService: {
      updateItem
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

function request(body: unknown) {
  return new NextRequest(
    `http://localhost/api/check-ins/${checkInId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json" }
    }
  );
}

describe("/api/check-ins/[id]/items/[itemId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    updateItem.mockResolvedValue({ id: itemId, state: "deferred" });
  });

  it("updates item state without accepting embedded decisions", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request({ state: "deferred", response: "Return next week." }),
      { params: Promise.resolve({ id: checkInId, itemId }) }
    );

    expect(response.status).toBe(200);
    expect(updateItem).toHaveBeenCalledWith(session, checkInId, itemId, {
      state: "deferred",
      response: "Return next week."
    });
  });
});
