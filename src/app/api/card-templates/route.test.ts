import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const listCardTemplates = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/repositories/card-templates", () => ({
  listCardTemplates
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function request(url = "http://localhost/api/card-templates") {
  return new NextRequest(url, {
    method: "GET",
    headers: {
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

describe("GET /api/card-templates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    listCardTemplates.mockResolvedValue([
      {
        id: "tpl_auto",
        slug: "auto",
        title: "Auto",
        labels: ["Out"],
        summary: "Auto summary",
        coverAssetPath: "/assets/fairplay/cards/auto.png",
        defaultLane: "not_in_play"
      }
    ]);
  });

  it("lists templates with search, label, and lane filters", async () => {
    const { GET } = await import("./route");

    const response = await GET(
      request(
        "http://localhost/api/card-templates?q=auto&labels=Out,Home&lane=not_in_play"
      )
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(listCardTemplates).toHaveBeenCalledWith({
      q: "auto",
      labels: ["Out", "Home"],
      lane: "not_in_play"
    });
    expect(body[0].coverAssetPath).toBe("/assets/fairplay/cards/auto.png");
  });

  it("rejects unauthenticated requests", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(listCardTemplates).not.toHaveBeenCalled();
  });
});
