import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const getCover = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    getCover
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request() {
  return new NextRequest(`http://localhost/api/ai-card-drafts/${id}/cover`, {
    headers: {
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

class ServiceError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

describe("GET /api/ai-card-drafts/[id]/cover", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    getCover.mockResolvedValue({
      bytes: Buffer.from([137, 80, 78, 71]),
      mimeType: "image/png"
    });
  });

  it("streams image bytes with the stored content type", async () => {
    const { GET } = await import("./route");

    const response = await GET(request(), { params: Promise.resolve({ id }) });
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect([...bytes]).toEqual([137, 80, 78, 71]);
    expect(getCover).toHaveBeenCalledWith(session, id);
  });

  it("rejects unsafe stored cover MIME types", async () => {
    getCover.mockResolvedValue({
      bytes: Buffer.from("<svg></svg>"),
      mimeType: "image/svg+xml"
    });
    const { GET } = await import("./route");

    const response = await GET(request(), { params: Promise.resolve({ id }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid request." });
  });

  it("requires authentication", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(request(), { params: Promise.resolve({ id }) });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
    expect(getCover).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid ids", async () => {
    const { GET } = await import("./route");

    const response = await GET(request(), {
      params: Promise.resolve({ id: "not-a-uuid" })
    });

    expect(response.status).toBe(400);
    expect(getCover).not.toHaveBeenCalled();
  });

  it("maps not-found service errors to 404", async () => {
    getCover.mockRejectedValue(new ServiceError("NOT_FOUND"));
    const { GET } = await import("./route");

    const response = await GET(request(), { params: Promise.resolve({ id }) });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "Not found." });
  });
});
