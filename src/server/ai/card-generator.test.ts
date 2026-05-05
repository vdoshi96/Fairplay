import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("./qwen-card-generator", () => ({
  generateCardCover: vi.fn(),
  structureTaskAsCard: vi.fn(),
  transcribeAudio: vi.fn()
}));

vi.mock("./openai-config", () => ({
  getOpenAiFallbackConfig: vi.fn()
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
import { getOpenAiFallbackConfig } from "./openai-config";
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

    expect(getOpenAiFallbackConfig).not.toHaveBeenCalled();
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI card structuring after Qwen fails when enabled", async () => {
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(new Error("Qwen down"));
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue(enabledFallback);
    vi.mocked(structureTaskAsCardWithOpenAi).mockResolvedValue(generatedCard);

    await expect(
      structureTaskAsCard({ taskText: "Dog medicine" })
    ).resolves.toEqual(generatedCard);

    expect(structureTaskAsCardWithOpenAi).toHaveBeenCalledWith(
      { taskText: "Dog medicine" },
      expect.objectContaining({ config: enabledFallback })
    );
  });

  it("rethrows the Qwen structuring error when fallback is disabled", async () => {
    const qwenError = new Error("Qwen down");
    vi.mocked(qwen.structureTaskAsCard).mockRejectedValue(qwenError);
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue({ enabled: false });

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
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue(enabledFallback);
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

  it("keeps the Qwen image error when OpenAI fallback returns a non-5:7 cover", async () => {
    const qwenError = new Error("Qwen image down");
    vi.mocked(qwen.generateCardCover).mockRejectedValue(qwenError);
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue(enabledFallback);
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
    ).rejects.toBe(qwenError);
  });

  it("uses Qwen for audio transcription when Qwen succeeds", async () => {
    vi.mocked(qwen.transcribeAudio).mockResolvedValue("Dog medicine every month.");

    await expect(
      transcribeAudio({ bytes: new Uint8Array([1, 2]), mimeType: "audio/webm" })
    ).resolves.toBe("Dog medicine every month.");

    expect(getOpenAiFallbackConfig).not.toHaveBeenCalled();
    expect(transcribeAudioWithOpenAi).not.toHaveBeenCalled();
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
    expect(generateCardCoverWithOpenAi).not.toHaveBeenCalled();
  });

  it("falls back to OpenAI audio transcription after Qwen ASR fails when enabled", async () => {
    vi.mocked(qwen.transcribeAudio).mockRejectedValue(new Error("Qwen ASR down"));
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue(enabledFallback);
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
    vi.mocked(getOpenAiFallbackConfig).mockReturnValue({ enabled: false });

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
