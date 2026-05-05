import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const get = vi.fn();
const update = vi.fn();
const retry = vi.fn();
const regenerateImage = vi.fn();
const putInPlay = vi.fn();
const cancel = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    get,
    update,
    retry,
    regenerateImage,
    putInPlay,
    cancel
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};
const id = "550e8400-e29b-41d4-a716-446655440010";

function request(path = `/api/ai-card-drafts/${id}`, body?: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: body === undefined ? "POST" : "PATCH",
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

const context = { params: Promise.resolve({ id }) };

class ServiceError extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

describe("/api/ai-card-drafts/[id]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    get.mockResolvedValue({ id, title: "Laundry cards", status: "ready" });
    update.mockResolvedValue({ id, title: "Laundry reset", status: "ready" });
    retry.mockResolvedValue({ id, status: "ready" });
    regenerateImage.mockResolvedValue({ id, status: "ready" });
    putInPlay.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440050",
      title: "Laundry reset"
    });
    cancel.mockResolvedValue({ id, status: "canceled" });
  });

  it("gets a draft by id", async () => {
    const { GET } = await import("./route");

    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    expect(get).toHaveBeenCalledWith(session, id);
  });

  it("patches a draft with validated updates", async () => {
    const { PATCH } = await import("./route");

    const response = await PATCH(
      request(`/api/ai-card-drafts/${id}`, {
        title: "Laundry reset",
        summary: null
      }),
      context
    );

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledWith(session, id, {
      title: "Laundry reset",
      summary: null
    });
  });

  it.each([
    ["retry", "./retry/route", retry, 200],
    ["regenerate image", "./regenerate-image/route", regenerateImage, 200],
    ["put in play", "./put-in-play/route", putInPlay, 201],
    ["cancel", "./cancel/route", cancel, 200]
  ])(
    "returns success for %s mutations",
    async (_label, routePath, serviceMethod, expectedStatus) => {
      const { POST } = await import(routePath);

      const response = await POST(request(), context);

      expect(response.status).toBe(expectedStatus);
      expect(serviceMethod).toHaveBeenCalledWith(session, id);
    }
  );

  it.each([
    ["retry", "./retry/route", retry],
    ["regenerate image", "./regenerate-image/route", regenerateImage],
    ["put in play", "./put-in-play/route", putInPlay],
    ["cancel", "./cancel/route", cancel]
  ])("returns 401 for unauthenticated %s mutations", async (_label, routePath) => {
    getCurrentSession.mockResolvedValue(null);
    const { POST } = await import(routePath);

    const response = await POST(request(), context);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
  });

  it.each([
    ["retry", "./retry/route", retry],
    ["regenerate image", "./regenerate-image/route", regenerateImage],
    ["put in play", "./put-in-play/route", putInPlay],
    ["cancel", "./cancel/route", cancel]
  ])("returns 400 for invalid %s ids", async (_label, routePath, serviceMethod) => {
    const { POST } = await import(routePath);

    const response = await POST(request(), {
      params: Promise.resolve({ id: "not-a-uuid" })
    });

    expect(response.status).toBe(400);
    expect(serviceMethod).not.toHaveBeenCalled();
  });

  it.each([
    ["retry", "./retry/route", retry],
    ["regenerate image", "./regenerate-image/route", regenerateImage],
    ["put in play", "./put-in-play/route", putInPlay],
    ["cancel", "./cancel/route", cancel]
  ])(
    "maps invalid-input service errors to 400 for %s",
    async (_label, routePath, serviceMethod) => {
      serviceMethod.mockRejectedValue(new ServiceError("INVALID_INPUT"));
      const { POST } = await import(routePath);

      const response = await POST(request(), context);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body).toEqual({ error: "Invalid request." });
    }
  );

  it.each([
    ["retry", "./retry/route", retry],
    ["regenerate image", "./regenerate-image/route", regenerateImage],
    ["put in play", "./put-in-play/route", putInPlay],
    ["cancel", "./cancel/route", cancel]
  ])(
    "maps not-found service errors to 404 for %s",
    async (_label, routePath, serviceMethod) => {
      serviceMethod.mockRejectedValue(new ServiceError("NOT_FOUND"));
      const { POST } = await import(routePath);

      const response = await POST(request(), context);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body).toEqual({ error: "Not found." });
    }
  );
});
