import { describe, expect, it, vi } from "vitest";

import { getQwenConfig, QwenConfigError, type QwenConfig } from "./qwen-config";
import {
  generateCardCover,
  QwenGenerationError,
  structureTaskAsCard,
  transcribeAudio
} from "./qwen-card-generator";

const config: QwenConfig = {
  cardApiKey: "card-secret",
  cardModel: "qwen3.6-max-preview",
  asrModel: "qwen3-asr-flash",
  openAiBaseUrl: "https://qwen.example/compatible-mode/v1",
  imageApiKey: "image-secret",
  imageModel: "qwen-image-2.0-pro",
  imageBaseUrl: "https://qwen.example/api/v1"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
}

describe("Qwen card generator", () => {
  it("throws a safe config error when required env vars are missing", async () => {
    expect(() => getQwenConfig({ QWEN_CARD_API_KEY: "present" })).toThrow(
      QwenConfigError
    );
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
                minimumStandard: "Books are returned or renewed by due date.",
                imagePrompt: "A library book stack with a due-date slip.",
                imageNegativePrompt: "logos, people, readable labels"
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

  it("generates a card cover and returns downloaded bytes", async () => {
    const imageBytes = new Uint8Array([137, 80, 78, 71]);
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
    expect(body.input.messages[0].content[0].text).toContain("Dog Meds");
    expect(body.parameters).toEqual(
      expect.objectContaining({
        negative_prompt: expect.stringContaining("people, logos"),
        prompt_extend: false,
        watermark: false,
        size: "500*700",
        n: 1
      })
    );
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
});
