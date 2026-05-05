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
  structureTaskAsCardWithOpenAi: vi.fn()
}));

import {
  generateCardCover,
  structureTaskAsCard,
  transcribeAudio
} from "./card-generator";
import { getOpenAiFallbackConfig } from "./openai-config";
import {
  generateCardCoverWithOpenAi,
  structureTaskAsCardWithOpenAi
} from "./openai-card-generator";
import * as qwen from "./qwen-card-generator";
import type { StructuredAiCard } from "./card-generation-shared";

const enabledFallback = {
  enabled: true,
  baseUrl: "https://api.openai.example/v1",
  textApiKey: "text-secret",
  textModel: "gpt-5-nano",
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

  it("falls back to OpenAI image generation after Qwen image generation fails", async () => {
    const cover = { bytes: new Uint8Array([1, 2, 3]), mimeType: "image/png" };
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

  it("keeps audio transcription on Qwen only", async () => {
    vi.mocked(qwen.transcribeAudio).mockResolvedValue("Dog medicine every month.");

    await expect(
      transcribeAudio({ bytes: new Uint8Array([1, 2]), mimeType: "audio/webm" })
    ).resolves.toBe("Dog medicine every month.");

    expect(getOpenAiFallbackConfig).not.toHaveBeenCalled();
    expect(structureTaskAsCardWithOpenAi).not.toHaveBeenCalled();
    expect(generateCardCoverWithOpenAi).not.toHaveBeenCalled();
  });
});
