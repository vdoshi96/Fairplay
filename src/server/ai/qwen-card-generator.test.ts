import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  getQwenConfig,
  QwenConfigError,
  QwenImageModelConfigError,
  type QwenConfig
} from "./qwen-config";
import {
  generateCardCover,
  QwenGenerationError,
  structureTaskAsCard,
  transcribeAudio
} from "./qwen-card-generator";
import { buildImagePrompt, cardSystemPrompt } from "./card-generation-shared";
import { CADENCES, HIDDEN_EFFORT_KEYS } from "@/domain/enums";

const config: QwenConfig = {
  cardApiKey: "card-secret",
  cardModel: "qwen3.6-max-preview",
  asrModel: "qwen3-asr-flash",
  openAiBaseUrl: "https://qwen.example/compatible-mode/v1",
  imageApiKey: "image-secret",
  imageModel: "qwen-image-2.0-pro",
  imageBaseUrl: "https://qwen.example/api/v1"
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

describe("Qwen card generator", () => {
  it("builds textless integrated app illustration prompts without fake card framing", () => {
    const prompt = buildImagePrompt(
      "Dog Meds",
      "medicine calendar beside a leash"
    );

    expect(prompt).toContain("textless app illustration");
    expect(prompt).toContain("large central silhouette");
    expect(prompt).toContain("blended into the app composition");
    expect(prompt).toContain("no fake card frame");
    expect(prompt).not.toContain("Title:");
    expect(prompt).not.toContain("title text near the top");
  });

  it("asks structured card generation for text-only card JSON", () => {
    expect(cardSystemPrompt).toMatch(/structured text only/i);
    expect(cardSystemPrompt).not.toMatch(/imagePrompt|imageNegativePrompt|textless app illustration/i);
  });

  it("tells Qwen to use app enum tokens for strict structured fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Take the Recycling Out",
                summary: "Move recyclables to the pickup location on time.",
                areaKeys: ["cleaning"],
                hiddenEffortKeys: ["noticing", "planning", "doing"],
                cadence: "weekly",
                definition: "Own the household recycling flow.",
                conception: "Notice when recycling is ready to go out.",
                planning: "Check the pickup schedule and sort materials.",
                execution: "Move the bins to the collection spot.",
                minimumStandard: "Recycling is out before pickup."
              })
            }
          }
        ]
      })
    );

    await structureTaskAsCard(
      { taskText: "take the recycling out" },
      { fetch: fetchMock, config }
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const promptText = body.messages.map((message: { content: string }) => message.content).join("\n");

    for (const key of HIDDEN_EFFORT_KEYS) {
      expect(promptText).toContain(key);
    }
    for (const cadence of CADENCES) {
      expect(promptText).toContain(cadence);
    }
    expect(promptText).toMatch(/enum tokens only/i);
    expect(promptText).toMatch(/not display labels or explanations/i);
  });

  it("throws a safe config error when required env vars are missing", async () => {
    expect(() => getQwenConfig({ QWEN_CARD_API_KEY: "present" })).toThrow(
      QwenConfigError
    );
  });

  it("rejects unapproved Qwen image models before generation can run", () => {
    expect(() =>
      getQwenConfig({
        QWEN_CARD_API_KEY: "card-secret",
        QWEN_CARD_MODEL: "qwen3.6-max-preview",
        QWEN_ASR_MODEL: "qwen3-asr-flash",
        QWEN_OPENAI_BASE_URL: "https://qwen.example/compatible-mode/v1",
        QWEN_IMAGE_API_KEY: "image-secret",
        QWEN_IMAGE_MODEL: "qwen-image-2.0",
        QWEN_IMAGE_BASE_URL: "https://qwen.example/api/v1"
      })
    ).toThrow(QwenImageModelConfigError);
  });

  it("rejects unapproved dependency-injected Qwen image models before network calls", async () => {
    const fetchMock = vi.fn();

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        {
          fetch: fetchMock,
          config: {
            ...config,
            imageModel: "qwen-image-2.0"
          }
        }
      )
    ).rejects.toThrow("Unsupported Qwen image model configured");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats blank and placeholder Qwen env values as missing", () => {
    expect(() =>
      getQwenConfig({
        QWEN_CARD_API_KEY: "replace-with-qwen-key-for-card-structuring-and-asr",
        QWEN_CARD_MODEL: "qwen3.6-max-preview",
        QWEN_ASR_MODEL: "   ",
        QWEN_OPENAI_BASE_URL: "https://qwen.example/compatible-mode/v1",
        QWEN_IMAGE_API_KEY: "image-secret",
        QWEN_IMAGE_MODEL: "qwen-image-2.0-pro",
        QWEN_IMAGE_BASE_URL: "https://qwen.example/api/v1"
      })
    ).toThrow(/QWEN_CARD_API_KEY, QWEN_ASR_MODEL/);
  });

  it("structures text cards without requiring unrelated Qwen ASR or image env", async () => {
    vi.stubEnv("QWEN_CARD_API_KEY", "card-secret");
    vi.stubEnv("QWEN_CARD_MODEL", "qwen3.6-max-preview");
    vi.stubEnv("QWEN_OPENAI_BASE_URL", "https://qwen.example/compatible-mode/v1");
    vi.stubEnv("QWEN_ASR_MODEL", "");
    vi.stubEnv("QWEN_IMAGE_API_KEY", "");
    vi.stubEnv("QWEN_IMAGE_MODEL", "");
    vi.stubEnv("QWEN_IMAGE_BASE_URL", "");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Library Book Returns",
                summary: "Keep borrowed books moving back on time.",
                areaKeys: ["home_admin"],
                hiddenEffortKeys: ["noticing", "planning", "doing"],
                cadence: "weekly",
                definition: "Track checked-out books and due dates.",
                conception: "Notice when books enter the house.",
                planning: "Check due dates and renew when useful.",
                execution: "Return books before fees or replacement stress.",
                minimumStandard: "Books are returned or renewed by due date."
              })
            }
          }
        ]
      })
    );

    await expect(
      structureTaskAsCard(
        { taskText: "make a card for library book returns" },
        { fetch: fetchMock }
      )
    ).resolves.toMatchObject({ title: "Library Book Returns" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("transcribes audio without requiring unrelated Qwen image env", async () => {
    vi.stubEnv("QWEN_CARD_API_KEY", "card-secret");
    vi.stubEnv("QWEN_ASR_MODEL", "qwen3-asr-flash");
    vi.stubEnv("QWEN_OPENAI_BASE_URL", "https://qwen.example/compatible-mode/v1");
    vi.stubEnv("QWEN_CARD_MODEL", "");
    vi.stubEnv("QWEN_IMAGE_API_KEY", "");
    vi.stubEnv("QWEN_IMAGE_MODEL", "");
    vi.stubEnv("QWEN_IMAGE_BASE_URL", "");
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "Dog meds every first Monday." } }]
      })
    );

    await expect(
      transcribeAudio(
        { bytes: new Uint8Array([104, 105]), mimeType: "audio/webm" },
        { fetch: fetchMock }
      )
    ).resolves.toBe("Dog meds every first Monday.");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.unstubAllEnvs();
  });

  it("generates images without requiring unrelated Qwen text or ASR env", async () => {
    vi.stubEnv("QWEN_IMAGE_API_KEY", "image-secret");
    vi.stubEnv("QWEN_IMAGE_MODEL", "qwen-image-2.0-pro");
    vi.stubEnv("QWEN_IMAGE_BASE_URL", "https://qwen.example/api/v1");
    vi.stubEnv("QWEN_CARD_API_KEY", "");
    vi.stubEnv("QWEN_CARD_MODEL", "");
    vi.stubEnv("QWEN_ASR_MODEL", "");
    vi.stubEnv("QWEN_OPENAI_BASE_URL", "");
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(pngBytes(5, 7), {
          status: 200,
          headers: { "content-type": "image/png" }
        })
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock }
      )
    ).resolves.toMatchObject({ mimeType: "image/png" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.unstubAllEnvs();
  });

  it("structures a task as strict Fairplay card JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: "Library Book Returns",
                summary: "Keep borrowed books moving back on time.",
                areaKeys: ["home_admin"],
                hiddenEffortKeys: ["noticing", "planning", "doing"],
                cadence: "weekly",
                definition: "Track checked-out books and due dates.",
                conception: "Notice when books enter the house.",
                planning: "Check due dates and renew when useful.",
                execution: "Return books before fees or replacement stress.",
                minimumStandard: "Books are returned or renewed by due date."
              })
            }
          }
        ]
      })
    );

    const card = await structureTaskAsCard(
      { taskText: "make a card for library book returns" },
      { fetch: fetchMock, config }
    );

    expect(card.title).toBe("Library Book Returns");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://qwen.example/compatible-mode/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer card-secret",
          "content-type": "application/json"
        })
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("qwen3.6-max-preview");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.temperature).toBeLessThanOrEqual(0.3);
    expect(body.messages[0].content).toMatch(/non-clinical/i);
    expect(body.messages[0].content).toMatch(/source-style|IP|intellectual property/i);
    expect(body.messages[1].content).toContain(
      "make a card for library book returns"
    );
  });

  it("transcribes audio with OpenAI-compatible input_audio content", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        choices: [{ message: { content: "Dog meds every first Monday." } }]
      })
    );

    const transcript = await transcribeAudio(
      {
        bytes: new Uint8Array([104, 105]),
        mimeType: "audio/webm",
        contextText: "Household card capture"
      },
      { fetch: fetchMock, config }
    );

    expect(transcript).toBe("Dog meds every first Monday.");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("qwen3-asr-flash");
    expect(body.messages[0]).toEqual({
      role: "system",
      content: [
        {
          type: "text",
          text: "Context for this short household task recording: Household card capture"
        }
      ]
    });
    expect(body.messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: "user",
          content: expect.arrayContaining([
            expect.objectContaining({
              type: "input_audio",
              input_audio: expect.objectContaining({
                data: "data:audio/webm;base64,aGk="
              })
            })
          ])
        })
      ])
    );
  });

  it("keeps image guardrails first while capping long prompts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(pngBytes(5, 7), {
          status: 200,
          headers: { "content-type": "image/png" }
        })
      );

    await generateCardCover(
      {
        title: "Very Long Card",
        imagePrompt: "generated prompt ".repeat(200),
        negativePrompt: "generated negative ".repeat(200)
      },
      { fetch: fetchMock, config }
    );

    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const prompt = body.input.messages[0].content[0].text;
    const negativePrompt = body.parameters.negative_prompt;
    expect(prompt).toHaveLength(800);
    expect(prompt.startsWith("Create an original textless app illustration")).toBe(true);
    expect(prompt).toContain("Do not copy public source decks");
    expect(negativePrompt).toHaveLength(500);
    expect(negativePrompt.startsWith("copied public source deck style")).toBe(true);
    expect(negativePrompt).toContain("gendered chore stereotypes");
  });

  it("generates a card cover and returns downloaded bytes", async () => {
    const imageBytes = pngBytes(5, 7);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(imageBytes, {
          status: 200,
          headers: { "content-type": "image/png" }
        })
      );

    const cover = await generateCardCover(
      {
        title: "Dog Meds",
        imagePrompt: "heartworm medicine calendar card",
        negativePrompt: "people, logos"
      },
      { fetch: fetchMock, config }
    );

    expect(cover).toEqual({ bytes: imageBytes, mimeType: "image/png" });
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "https://qwen.example/api/v1/services/aigc/multimodal-generation/generation",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: "Bearer image-secret",
          "content-type": "application/json"
        })
      })
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("qwen-image-2.0-pro");
    expect(body.input.messages[0].content[0].text).toContain(
      "Responsibility theme: Dog Meds"
    );
    expect(body.input.messages[0].content[0].text).not.toContain("Title:");
    expect(body.parameters).toEqual(
      expect.objectContaining({
        negative_prompt: expect.stringContaining("people, logos"),
        prompt_extend: false,
        watermark: false,
        size: "1460*2044",
        n: 1
      })
    );
  });

  it("normalizes supported raster cover MIME types before persistence", async () => {
    const imageBytes = pngBytes(5, 7);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(imageBytes, {
          status: 200,
          headers: { "content-type": "image/png; charset=binary" }
        })
      );

    const cover = await generateCardCover(
      {
        title: "Dog Meds",
        imagePrompt: "heartworm medicine calendar card",
        negativePrompt: "people, logos"
      },
      { fetch: fetchMock, config }
    );

    expect(cover).toEqual({ bytes: imageBytes, mimeType: "image/png" });
  });

  it("throws a generation error when downloaded PNG cover is not 5:7", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(pngBytes(1, 1), {
          status: 200,
          headers: { "content-type": "image/png" }
        })
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });

  it("throws a generation error when downloaded PNG cover dimensions are undetectable", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
          {
            status: 200,
            headers: { "content-type": "image/png" }
          }
        )
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });

  it("throws a generation error when downloaded image bytes do not match the declared MIME type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.png" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response(new Uint8Array([1, 2, 3, 4]), {
          status: 200,
          headers: { "content-type": "image/png" }
        })
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });

  it("throws a generation error when image response has no image URL", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        output: {
          choices: [{ message: { content: [{ text: "no image" }] } }]
        }
      })
    );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });

  it("adds safe metadata to non-OK Qwen provider errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("do not log raw provider body", {
        status: 401,
        headers: { "x-request-id": "qwen_req_123" }
      })
    );

    await expect(
      structureTaskAsCard({ taskText: "Dog Meds" }, { fetch: fetchMock, config })
    ).rejects.toMatchObject({
      code: "QWEN_GENERATION_FAILED",
      provider: "qwen",
      model: "qwen3.6-max-preview",
      status: 401,
      providerRequestId: "qwen_req_123"
    });
  });

  it("throws a generation error for generated image URLs with unsupported schemes", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        output: {
          choices: [{ message: { content: [{ image: "file:///tmp/cover.png" }] } }]
        }
      })
    );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws a generation error when downloaded cover is not an image", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.txt" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response("not an image", {
          status: 200,
          headers: { "content-type": "text/plain" }
        })
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });

  it("throws a generation error when downloaded cover is SVG", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          output: {
            choices: [
              {
                message: {
                  content: [{ image: "https://cdn.example/cover.svg" }]
                }
              }
            ]
          }
        })
      )
      .mockResolvedValueOnce(
        new Response("<svg />", {
          status: 200,
          headers: { "content-type": "image/svg+xml" }
        })
      );

    await expect(
      generateCardCover(
        {
          title: "Dog Meds",
          imagePrompt: "heartworm medicine calendar card",
          negativePrompt: "people, logos"
        },
        { fetch: fetchMock, config }
      )
    ).rejects.toBeInstanceOf(QwenGenerationError);
  });
});
