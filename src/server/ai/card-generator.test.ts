import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("./qwen-card-generator", () => ({
  generateCardCover: vi.fn(),
  structureTaskAsCard: vi.fn(),
  transcribeAudio: vi.fn()
}));

vi.mock("./openai-config", () => ({
  getOpenAiAsrFallbackConfig: vi.fn(),
  getOpenAiImageFallbackConfig: vi.fn(),
  getOpenAiTextFallbackConfig: vi.fn()
}));

vi.mock("./openai-card-generator", () => ({
  generateCardCoverWithOpenAi: vi.fn(),
  structureTaskAsCardWithOpenAi: vi.fn(),
  transcribeAudioWithOpenAi: vi.fn()
}));

import {
  generateCardCover,
  structureTaskAsCard,
  transcribeAudio
} from "./card-generator";
import {
  getOpenAiAsrFallbackConfig,
  getOpenAiImageFallbackConfig,
  getOpenAiTextFallbackConfig
} from "./openai-config";
import {
  generateCardCoverWithOpenAi,
  structureTaskAsCardWithOpenAi,
  transcribeAudioWithOpenAi
} from "./openai-card-generator";
import * as qwen from "./qwen-card-generator";
import type { StructuredAiCard } from "./card-generation-shared";

const enabledFallback = {
  enabled: true,
  baseUrl: "https://api.openai.example/v1",
  textApiKey: "text-secret",
  textModel: "gpt-5-nano",
  asrApiKey: "asr-secret",
  asrModel: "gpt-4o-mini-transcribe",
  imageApiKey: "image-secret",
  imageModel: "gpt-image-1-mini"
} as const;

const generatedCard: StructuredAiCard = {
  title: "Dog Medicine",
  summary: "Keep the dog medicine cadence visible.",
  areaKeys: ["pet_care"],
  hiddenEffortKeys: ["noticing", "planning"],
  cadence: "monthly",
  definition: "Track the medicine schedule.",
  conception: "Notice refill and dose timing.",
  planning: "Put the next dose on the household calendar.",
  execution: "Give the medicine and record it.",
  minimumStandard: "Medicine is given by the due date.",
  imagePrompt: "dog medicine calendar still life",
  imageNegativePrompt: "people, logos"
};

describe("provider-neutral card generator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses Qwen for card structuring when Qwen succeeds", async () => {
    vi.mocked(qwen.structureTaskAsCard).mockResolvedValue(generatedCard);

    await expect(
      structureTaskAsCard({ taskText: "Dog medicine" })
    ).resolves.toEqual(generatedCard);

    expect(getOpenAiTextFallbackConfig).not.toHaveBeenCalled();
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI card structuring after Qwen fails when enabled", async () => {
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(new Error("Qwen down"));
    vi.mocked(getOpenAiTextFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(structureTaskAsCardWithOpenAi).mockResolvedValue(generatedCard);

    await expect(
      structureTaskAsCard({ taskText: "Dog medicine" })
    ).resolves.toEqual(generatedCard);

    expect(structureTaskAsCardWithOpenAi).toHaveBeenCalledWith(
      { taskText: "Dog medicine" },
      expect.objectContaining({ config: enabledFallback })
    );
  });

  it("logs the Qwen primary failure before OpenAI fallback starts", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(
      Object.assign(new Error("Qwen down"), {
        code: "QWEN_GENERATION_FAILED",
        provider: "qwen",
        model: "qwen3.6-max-preview",
        status: 503,
        providerRequestId: "qwen_req_123"
      })
    );
    vi.mocked(getOpenAiTextFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(structureTaskAsCardWithOpenAi).mockResolvedValue(generatedCard);

    await structureTaskAsCard(
      { taskText: "Dog medicine" },
      { requestId: "fp_ai_test", route: "/api/ai-card-drafts" }
    );

    expect(warn.mock.calls.map((call) => JSON.parse(call[1] as string).event)).toEqual([
      "provider_failure",
      "provider_fallback_start"
    ]);
    expect(JSON.parse(warn.mock.calls[0][1] as string)).toMatchObject({
      requestId: "fp_ai_test",
      event: "provider_failure",
      provider: "qwen",
      model: "qwen3.6-max-preview",
      status: 503,
      providerRequestId: "qwen_req_123"
    });
    expect(warn.mock.calls.join(" ")).not.toMatch(/Dog medicine|api[_-]?key|prompt/i);
    warn.mockRestore();
  });

  it("logs primary and fallback failures separately when OpenAI fallback fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(
      Object.assign(new Error("Qwen down"), {
        code: "QWEN_GENERATION_FAILED",
        provider: "qwen",
        model: "qwen3.6-max-preview",
        status: 503
      })
    );
    vi.mocked(getOpenAiTextFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(structureTaskAsCardWithOpenAi).mockRejectedValue(
      Object.assign(new Error("OpenAI down"), {
        code: "OPENAI_GENERATION_FAILED",
        provider: "openai",
        model: "gpt-5-nano",
        status: 429
      })
    );

    await expect(
      structureTaskAsCard(
        { taskText: "Dog medicine" },
        { requestId: "fp_ai_test", route: "/api/ai-card-drafts" }
      )
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_FALLBACK_FAILED",
      message: "AI provider fallback failed after primary provider failure.",
      provider: "openai",
      model: "gpt-5-nano",
      status: 429
    });

    expect(warn.mock.calls.map((call) => JSON.parse(call[1] as string).event)).toEqual([
      "provider_failure",
      "provider_fallback_start",
      "provider_fallback_failure"
    ]);
    expect(JSON.parse(warn.mock.calls[2][1] as string)).toMatchObject({
      event: "provider_fallback_failure",
      provider: "openai",
      model: "gpt-5-nano",
      status: 429
    });
    expect(warn.mock.calls.join(" ")).not.toMatch(/Dog medicine|api[_-]?key|prompt/i);
    warn.mockRestore();
  });

  it("rethrows the Qwen structuring error when fallback is disabled", async () => {
    const qwenError = new Error("Qwen down");
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(qwenError);
    vi.mocked(getOpenAiTextFallbackConfig).mockReturnValue({ enabled: false });

    await expect(structureTaskAsCard({ taskText: "Dog medicine" })).rejects.toBe(
      qwenError
    );
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI image generation after Qwen image generation fails with a valid 5:7 PNG", async () => {
    const cover = {
      bytes: tinyPngWithDimensions(500, 700),
      mimeType: "image/png"
    };
    vi.mocked(qwen.generateCardCover).mockRejectedValue(new Error("Qwen image down"));
    vi.mocked(getOpenAiImageFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(generateCardCoverWithOpenAi).mockResolvedValue(cover);

    await expect(
      generateCardCover({
        title: "Dog Medicine",
        imagePrompt: "calendar still life",
        negativePrompt: "people"
      })
    ).resolves.toEqual(cover);

    expect(generateCardCoverWithOpenAi).toHaveBeenCalledWith(
      {
        title: "Dog Medicine",
        imagePrompt: "calendar still life",
        negativePrompt: "people"
      },
      expect.objectContaining({ config: enabledFallback })
    );
  });

  it("fails closed with OpenAI metadata when image fallback returns a non-5:7 cover", async () => {
    vi.mocked(qwen.generateCardCover).mockRejectedValue(new Error("Qwen image down"));
    vi.mocked(getOpenAiImageFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(generateCardCoverWithOpenAi).mockResolvedValue({
      bytes: tinyPngWithDimensions(1024, 1536),
      mimeType: "image/png"
    });

    await expect(
      generateCardCover({
        title: "Dog Medicine",
        imagePrompt: "calendar still life",
        negativePrompt: "people"
      })
    ).rejects.toMatchObject({
      code: "AI_PROVIDER_FALLBACK_FAILED",
      model: "gpt-image-1-mini",
      provider: "openai"
    });
  });

  it("uses Qwen for audio transcription when Qwen succeeds", async () => {
    vi.mocked(qwen.transcribeAudio).mockResolvedValue("Dog medicine every month.");

    await expect(
      transcribeAudio({ bytes: new Uint8Array([1, 2]), mimeType: "audio/webm" })
    ).resolves.toBe("Dog medicine every month.");

    expect(getOpenAiAsrFallbackConfig).not.toHaveBeenCalled();
    expect(transcribeAudioWithOpenAi).not.toHaveBeenCalled();
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
    expect(generateCardCoverWithOpenAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI audio transcription after Qwen ASR fails when enabled", async () => {
    vi.mocked(qwen.transcribeAudio).mockRejectedValue(new Error("Qwen ASR down"));
    vi.mocked(getOpenAiAsrFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(transcribeAudioWithOpenAi).mockResolvedValue("Dog medicine every month.");

    await expect(
      transcribeAudio({
        bytes: new Uint8Array([1, 2]),
        mimeType: "audio/webm",
        contextText: "Household task capture"
      })
    ).resolves.toBe("Dog medicine every month.");

    expect(transcribeAudioWithOpenAi).toHaveBeenCalledWith(
      {
        bytes: new Uint8Array([1, 2]),
        mimeType: "audio/webm",
        contextText: "Household task capture"
      },
      expect.objectContaining({ config: enabledFallback })
    );
  });

  it("rethrows the Qwen ASR error when transcription fallback is disabled", async () => {
    const qwenError = new Error("Qwen ASR down");
    vi.mocked(qwen.transcribeAudio).mockRejectedValue(qwenError);
    vi.mocked(getOpenAiAsrFallbackConfig).mockReturnValue({ enabled: false });

    await expect(
      transcribeAudio({ bytes: new Uint8Array([1, 2]), mimeType: "audio/webm" })
    ).rejects.toBe(qwenError);
    expect(transcribeAudioWithOpenAi).not.toHaveBeenCalled();
  });
});

function tinyPngWithDimensions(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  writeUint32(bytes, 16, width);
  writeUint32(bytes, 20, height);
  return bytes;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 0xff;
  bytes[offset + 1] = (value >>> 16) & 0xff;
  bytes[offset + 2] = (value >>> 8) & 0xff;
  bytes[offset + 3] = value & 0xff;
}
