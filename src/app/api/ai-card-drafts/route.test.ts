import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCurrentSession = vi.fn();
const list = vi.fn();
const createFromText = vi.fn();

vi.mock("@/server/auth/current-session", () => ({
  getCurrentSession
}));

vi.mock("@/server/ai/diagnostics", () => ({
  createAiRequestDiagnostics: () => ({
    requestId: "fp_ai_test",
    route: "/api/ai-card-drafts"
  })
}));

vi.mock("@/server/ai-card-drafts/service", () => ({
  aiCardDraftService: {
    list,
    createFromText
  }
}));

const session = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  householdId: "550e8400-e29b-41d4-a716-446655440000",
  selectedPersonaId: "550e8400-e29b-41d4-a716-446655440001"
};

function jsonRequest(method: "GET" | "POST", body?: unknown) {
  return new NextRequest("http://localhost/api/ai-card-drafts", {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: {
      "content-type": "application/json",
      cookie: "fairplay_session=raw-session-token"
    }
  });
}

function multipartRequest(parts: string[], headers?: HeadersInit) {
  const boundary = "fairplay-test-boundary";

  return new NextRequest("http://localhost/api/ai-card-drafts", {
    method: "POST",
    body: [
      ...parts,
      `--${boundary}--`,
      ""
    ].join("\r\n"),
    headers: {
      "content-type": `multipart/form-data; boundary=${boundary}`,
      cookie: "fairplay_session=raw-session-token",
      ...headers
    }
  });
}

function multipartTextPart(name: string, value: string) {
  return [
    `--fairplay-test-boundary`,
    `Content-Disposition: form-data; name="${name}"`,
    "",
    value
  ].join("\r\n");
}

function multipartFilePart(
  name: string,
  filename: string,
  contentType: string,
  value: string
) {
  return [
    `--fairplay-test-boundary`,
    `Content-Disposition: form-data; name="${name}"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    "",
    value
  ].join("\r\n");
}

describe("/api/ai-card-drafts", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getCurrentSession.mockResolvedValue(session);
    list.mockResolvedValue([
      {
        id: "550e8400-e29b-41d4-a716-446655440010",
        title: "Reset snack shelf",
        promptPreview: "The snack shelf is chaotic",
        status: "ready",
        generationStage: "ready",
        sourceInputType: "text"
      }
    ]);
    createFromText.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440011",
      sourceInputType: "text"
    });
  });

  it("requires authentication to list drafts", async () => {
    getCurrentSession.mockResolvedValue(null);
    const { GET } = await import("./route");

    const response = await GET(jsonRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Authentication required." });
    expect(list).not.toHaveBeenCalled();
  });

  it("lists AI card drafts through the active session", async () => {
    const { GET } = await import("./route");

    const response = await GET(jsonRequest("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith(session);
    expect(body[0]).toMatchObject({
      title: "Reset snack shelf",
      sourceInputType: "text"
    });
  });

  it("creates an AI card draft from JSON text", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      jsonRequest("POST", {
        inputText: "Turn the weekly mail pile into a concrete household card."
      })
    );

    expect(response.status).toBe(201);
    expect(createFromText).toHaveBeenCalledWith(
      session,
      {
        inputText: "Turn the weekly mail pile into a concrete household card."
      },
      { requestId: "fp_ai_test", route: "/api/ai-card-drafts" }
    );
  });

  it("returns 400 for multipart audio because product capture is text-only", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      multipartRequest([
        multipartFilePart("audio", "voice-note.webm", "audio/webm", "abc"),
        multipartTextPart("inputText", "Use the Saturday reset context.")
      ])
    );

    expect(response.status).toBe(400);
    expect(createFromText).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid JSON create requests", async () => {
    const { POST } = await import("./route");

    const response = await POST(jsonRequest("POST", { inputText: "" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ error: "Invalid request." });
    expect(createFromText).not.toHaveBeenCalled();
  });

  it("returns 400 for multipart requests because only JSON text is supported", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      multipartRequest([
        multipartFilePart("audio", "empty.webm", "audio/webm", "")
      ])
    );

    expect(response.status).toBe(400);
    expect(createFromText).not.toHaveBeenCalled();
  });

  it("returns 400 before parsing unsupported multipart requests over the route size cap", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      multipartRequest(
        [multipartFilePart("audio", "voice-note.webm", "audio/webm", "abc")],
        { "content-length": String(10 * 1024 * 1024 + 1) }
      )
    );

    expect(response.status).toBe(400);
    expect(createFromText).not.toHaveBeenCalled();
  });

  it("returns 400 before buffering unsupported multipart files over the route size cap", async () => {
    const audio = {
      size: 10 * 1024 * 1024 + 1,
      type: "audio/webm",
      arrayBuffer: vi.fn()
    };
    const formData = new FormData();
    vi.spyOn(formData, "get").mockImplementation((key: string) =>
      key === "audio" ? audio as unknown as File : null
    );
    vi.spyOn(NextRequest.prototype, "formData").mockResolvedValueOnce(formData);
    const { POST } = await import("./route");

    const response = await POST(
      multipartRequest([
        multipartFilePart("audio", "voice-note.webm", "audio/webm", "abc")
      ])
    );

    expect(response.status).toBe(400);
    expect(audio.arrayBuffer).not.toHaveBeenCalled();
    expect(createFromText).not.toHaveBeenCalled();
  });

  it("maps generation failures to safe JSON with request and draft ids", async () => {
    createFromText.mockRejectedValue(
      Object.assign(new Error("raw provider body must not leak"), {
        code: "GENERATION_FAILED",
        draftId: "550e8400-e29b-41d4-a716-446655440011"
      })
    );
    const { POST } = await import("./route");

    const response = await POST(
      jsonRequest("POST", {
        inputText: "Turn the weekly mail pile into a concrete household card."
      })
    );
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body).toEqual({
      error: "AI card draft generation failed.",
      code: "GENERATION_FAILED",
      draftId: "550e8400-e29b-41d4-a716-446655440011",
      requestId: "fp_ai_test"
    });
  });
});
