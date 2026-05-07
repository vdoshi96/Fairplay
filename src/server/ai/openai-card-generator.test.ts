import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { OpenAiEnabledFallbackConfig } from "./openai-config";
import {
  generateCardCoverWithOpenAi,
  OpenAiGenerationError,
  structureTaskAsCardWithOpenAi,
  transcribeAudioWithOpenAi
} from "./openai-card-generator";

const config: OpenAiEnabledFallbackConfig = {
  enabled: true,
  baseUrl: "https://api.openai.example/v1",
  textApiKey: "text-secret",
  textModel: "gpt-5-nano",
  asrApiKey: "asr-secret",
  asrModel: "gpt-4o-mini-transcribe",
  imageApiKey: "image-secret",
  imageModel: "gpt-image-1-mini"
};

afterEach(() => {
  vi.unstubAllEnvs();
});

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}

function pngBytes(width: number, height: number) {
  const bytes = new Uint8Array(45);
  const view = new DataView(bytes.buffer);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  view.setUint32(8, 13);
  bytes.set(asciiBytes("IHDR"), 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  bytes[24] = 8;
  bytes[25] = 2;
  bytes[26] = 0;
  bytes[27] = 0;
  bytes[28] = 0;
  view.setUint32(33, 0);
  bytes.set(asciiBytes("IEND"), 37);
  return bytes;
}

function asciiBytes(value: string) {
  return Uint8Array.from(value, (char) => char.charCodeAt(0));
}

const validCard = {
  title: "Library Book Returns",
  summary: "Keep borrowed books moving back on time.",
  areaKeys: ["home_base"],
  hiddenEffortKeys: ["noticing", "planning", "doing"],
  cadence: "weekly",
  definition: "Track checked-out books and due dates.",
  conception: "Notice when books enter the house.",
  planning: "Check due dates and renew when useful.",
  execution: "Return books before fees or replacement stress.",
  minimumStandard: "Books are returned or renewed by due date.",
  imagePrompt: "A library book stack with a due-date slip.",
  imageNegativePrompt: "logos, people, readable labels"
};

describe("OpenAI fallback card generator", () => {
  it("rejects unapproved dependency-injected image models before network calls", async () => {
    const fetchMock = vi.fn();

    await expect(
      generateCardCoverWithOpenAi(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        {
          fetch: fetchMock,
          config: {
            ...config,
            imageModel: "gpt-image-2"
          } as unknown as OpenAiEnabledFallbackConfig
        }
      )
    ).rejects.toThrow("Unsupported OpenAI image model configured");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("transcribes audio through the Transcriptions API with context prompt", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        text: "Dog medicine every month."
      })
    );

    const transcript = await transcribeAudioWithOpenAi(
      {
        bytes: new Uint8Array([1, 2, 3]),
        mimeType: "audio/webm",
        contextText: "Household task capture"
      },
      { fetch: fetchMock, config }
    );

    expect(transcript).toBe("Dog medicine every month.");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.example/v1/audio/transcriptions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer asr-secret"
        })
      })
    );
    const request = fetchMock.mock.calls[0][1];
    expect(request.headers).not.toHaveProperty("content-type");
    expect(request.body).toBeInstanceOf(FormData);
    const form = request.body as FormData;
    expect(form.get("model")).toBe("gpt-4o-mini-transcribe");
    expect(form.get("response_format")).toBe("json");
    expect(form.get("prompt")).toBe(
      "Context for this short household task recording: Household task capture"
    );
    const file = form.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("recording.webm");
    expect((file as File).type).toBe("audio/webm");
  });

  it("throws a generation error when OpenAI transcription returns no text", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ text: "" }));

    await expect(
      transcribeAudioWithOpenAi(
        {
          bytes: new Uint8Array([1, 2, 3]),
          mimeType: "audio/webm"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(OpenAiGenerationError);
  });

  it("adds safe metadata to non-OK OpenAI provider errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("do not log raw provider body", {
        status: 429,
        headers: { "x-request-id": "openai_req_123" }
      })
    );

    await expect(
      structureTaskAsCardWithOpenAi(
        { taskText: "Dog Meds" },
        { fetch: fetchMock, config }
      )
    ).rejects.toMatchObject({
      code: "OPENAI_GENERATION_FAILED",
      provider: "openai",
      model: "gpt-5-nano",
      status: 429,
      providerRequestId: "openai_req_123"
    });
  });

  it("structures text cards without requiring unrelated OpenAI ASR or image fallback env", async () => {
    vi.stubEnv("AI_PROVIDER_FALLBACK_ENABLED", "true");
    vi.stubEnv("OPENAI_BASE_URL", "https://api.openai.example/v1");
    vi.stubEnv("OPENAI_TEXT_API_KEY", "text-secret");
    vi.stubEnv("OPENAI_TEXT_MODEL", "gpt-5-nano");
    vi.stubEnv("OPENAI_ASR_API_KEY", "");
    vi.stubEnv("OPENAI_ASR_MODEL", "");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        output_text: JSON.stringify(validCard)
      })
    );

    await expect(
      structureTaskAsCardWithOpenAi(
        { taskText: "make a card for library book returns" },
        { fetch: fetchMock }
      )
    ).resolves.toMatchObject({ title: "Library Book Returns" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("transcribes audio without requiring unrelated OpenAI text or image fallback env", async () => {
    vi.stubEnv("AI_PROVIDER_FALLBACK_ENABLED", "true");
    vi.stubEnv("OPENAI_BASE_URL", "https://api.openai.example/v1");
    vi.stubEnv("OPENAI_ASR_API_KEY", "asr-secret");
    vi.stubEnv("OPENAI_ASR_MODEL", "gpt-4o-mini-transcribe");
    vi.stubEnv("OPENAI_TEXT_API_KEY", "");
    vi.stubEnv("OPENAI_TEXT_MODEL", "");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        text: "Dog medicine every month."
      })
    );

    await expect(
      transcribeAudioWithOpenAi(
        { bytes: new Uint8Array([1, 2, 3]), mimeType: "audio/webm" },
        { fetch: fetchMock }
      )
    ).resolves.toBe("Dog medicine every month.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("generates images without requiring unrelated OpenAI text or ASR fallback env", async () => {
    vi.stubEnv("AI_PROVIDER_FALLBACK_ENABLED", "true");
    vi.stubEnv("OPENAI_BASE_URL", "https://api.openai.example/v1");
    vi.stubEnv("OPENAI_IMAGE_API_KEY", "image-secret");
    vi.stubEnv("OPENAI_IMAGE_MODEL", "gpt-image-1-mini");
    vi.stubEnv("OPENAI_TEXT_API_KEY", "");
    vi.stubEnv("OPENAI_TEXT_MODEL", "");
    vi.stubEnv("OPENAI_ASR_API_KEY", "");
    vi.stubEnv("OPENAI_ASR_MODEL", "");
    const imageBytes = pngBytes(1024, 1536);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            b64_json: Buffer.from(imageBytes).toString("base64")
          }
        ],
        output_format: "png"
      })
    );

    await expect(
      generateCardCoverWithOpenAi(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock }
      )
    ).resolves.toMatchObject({ mimeType: "image/png" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("structures a task through the Responses API with strict JSON schema output", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        output_text: JSON.stringify(validCard)
      })
    );

    const card = await structureTaskAsCardWithOpenAi(
      { taskText: "make a card for library book returns" },
      { fetch: fetchMock, config }
    );

    expect(card.title).toBe("Library Book Returns");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.example/v1/responses",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer text-secret",
          "content-type": "application/json"
        })
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("gpt-5-nano");
    expect(body.instructions).toMatch(/non-clinical/i);
    expect(body.instructions).toMatch(/source-style|IP|proprietary/i);
    expect(body.input[0].content[0].text).toContain(
      "make a card for library book returns"
    );
    expect(body.text.format).toEqual(
      expect.objectContaining({
        type: "json_schema",
        name: "fairplay_ai_card",
        strict: true
      })
    );
    expect(body.text.format.schema.properties.areaKeys.items).toEqual({
      type: "string",
      minLength: 1,
      maxLength: 80
    });
  });

  it("generates a portrait PNG cover from GPT image base64 output", async () => {
    const imageBytes = pngBytes(1024, 1536);
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            b64_json: Buffer.from(imageBytes).toString("base64")
          }
        ],
        output_format: "png"
      })
    );

    const cover = await generateCardCoverWithOpenAi(
      {
        title: "Dog Meds",
        imagePrompt: "heartworm medicine calendar card",
        negativePrompt: "people, logos"
      },
      { fetch: fetchMock, config }
    );

    expect(cover).toEqual({ bytes: imageBytes, mimeType: "image/png" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.openai.example/v1/images/generations",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer image-secret",
          "content-type": "application/json"
        })
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual(
      expect.objectContaining({
        model: "gpt-image-1-mini",
        size: "1024x1536",
        quality: "low",
        output_format: "png",
        n: 1
      })
    );
    expect(body.prompt).toContain("textless app illustration");
    expect(body.prompt).toContain("large central silhouette");
    expect(body.prompt).toContain("blended into the app composition");
    expect(body.prompt).toContain("no fake card frame");
    expect(body.prompt).toContain("Responsibility theme: Dog Meds");
    expect(body.prompt).not.toContain("Title:");
    expect(body.prompt).not.toContain("title text near the top");
    expect(body.prompt).toMatch(/Do not copy public source decks/i);
  });

  it("throws a generation error when OpenAI returns no image bytes or URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ data: [{}] }));

    await expect(
      generateCardCoverWithOpenAi(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(OpenAiGenerationError);
  });

  it("rejects unapproved direct OpenAI image config before sending a request", async () => {
    const fetchMock = vi.fn();
    const unsafeConfig = {
      ...config,
      imageModel: "gpt-image-2"
    } as unknown as OpenAiEnabledFallbackConfig;

    await expect(
      generateCardCoverWithOpenAi(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config: unsafeConfig }
      )
    ).rejects.toMatchObject({
      code: "OPENAI_GENERATION_FAILED",
      model: "gpt-image-2",
      provider: "openai"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws a generation error when base64 output is not a supported raster image", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: [
          {
            b64_json: Buffer.from("not an image").toString("base64")
          }
        ],
        output_format: "png"
      })
    );

    await expect(
      generateCardCoverWithOpenAi(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(OpenAiGenerationError);
  });
});
