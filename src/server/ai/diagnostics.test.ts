import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createAiRequestDiagnostics,
  logAiGenerationDiagnostic,
  serializeAiError,
  unsafeValueLooksPresent
} from "./diagnostics";

describe("AI diagnostics", () => {
  it("creates non-secret request ids with the fp_ai prefix", () => {
    expect(createAiRequestDiagnostics({ route: "/api/ai-card-drafts" })).toMatchObject({
      route: "/api/ai-card-drafts"
    });
    expect(createAiRequestDiagnostics({ route: "/api/ai-card-drafts" }).requestId).toMatch(
      /^fp_ai_[a-z0-9]+$/i
    );
  });

  it("serializes only safe error metadata", () => {
    const error = Object.assign(new Error("Provider failed with sk-live-secret"), {
      code: "QWEN_GENERATION_FAILED",
      provider: "qwen",
      model: "qwen-image-2.0-pro",
      status: 401,
      providerRequestId: "req_123"
    });

    expect(serializeAiError(error)).toEqual({
      code: "QWEN_GENERATION_FAILED",
      message: "Provider request failed.",
      model: "qwen-image-2.0-pro",
      name: "Error",
      provider: "qwen",
      providerRequestId: "req_123",
      status: 401
    });
    expect(JSON.stringify(serializeAiError(error))).not.toContain("sk-live-secret");
  });

  it("rejects blank and placeholder-like env values", () => {
    expect(unsafeValueLooksPresent("")).toBe(false);
    expect(unsafeValueLooksPresent("   ")).toBe(false);
    expect(unsafeValueLooksPresent("replace-with-qwen-key-for-card-structuring-and-asr")).toBe(false);
    expect(unsafeValueLooksPresent("real-ish-value")).toBe(true);
  });

  it("logs redacted diagnostic events", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    logAiGenerationDiagnostic({
      requestId: "fp_ai_test",
      route: "/api/ai-card-drafts",
      stage: "generating_image",
      event: "provider_failure",
      provider: "qwen",
      model: "qwen-image-2.0-pro",
      status: 401,
      errorName: "QwenGenerationError",
      errorCode: "QWEN_GENERATION_FAILED"
    });

    expect(warn).toHaveBeenCalledWith(
      "[fairplay-ai-diagnostics]",
      expect.stringContaining("\"requestId\":\"fp_ai_test\"")
    );
    expect(warn.mock.calls[0].join(" ")).not.toMatch(/api[_-]?key|transcript|prompt|audio/i);
    warn.mockRestore();
  });
});
