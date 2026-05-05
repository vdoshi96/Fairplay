import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getOpenAiFallbackConfig,
  OpenAiFallbackConfigError
} from "./openai-config";

describe("OpenAI fallback config", () => {
  it("stays disabled unless the fallback flag is explicitly true", () => {
    expect(getOpenAiFallbackConfig({})).toEqual({ enabled: false });
    expect(
      getOpenAiFallbackConfig({ AI_PROVIDER_FALLBACK_ENABLED: "false" })
    ).toEqual({ enabled: false });
  });

  it("resolves enabled fallback config from text and image env vars", () => {
    expect(
      getOpenAiFallbackConfig({
        AI_PROVIDER_FALLBACK_ENABLED: "true",
        OPENAI_BASE_URL: "https://api.openai.example/v1",
        OPENAI_TEXT_API_KEY: "text-secret",
        OPENAI_TEXT_MODEL: "gpt-5-nano",
        OPENAI_ASR_API_KEY: "asr-secret",
        OPENAI_ASR_MODEL: "gpt-4o-mini-transcribe",
        OPENAI_IMAGE_API_KEY: "image-secret",
        OPENAI_IMAGE_MODEL: "gpt-image-1-mini"
      })
    ).toEqual({
      enabled: true,
      baseUrl: "https://api.openai.example/v1",
      textApiKey: "text-secret",
      textModel: "gpt-5-nano",
      asrApiKey: "asr-secret",
      asrModel: "gpt-4o-mini-transcribe",
      imageApiKey: "image-secret",
      imageModel: "gpt-image-1-mini"
    });
  });

  it("throws a safe config error when fallback is enabled without required vars", () => {
    expect(() =>
      getOpenAiFallbackConfig({
        AI_PROVIDER_FALLBACK_ENABLED: "true",
        OPENAI_TEXT_API_KEY: "text-secret"
      })
    ).toThrow(OpenAiFallbackConfigError);
  });
});
