import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { OpenAiEnabledFallbackConfig } from "./openai-config";
import {
  generateCardCoverWithOpenAi,
  OpenAiGenerationError,
  structureTaskAsCardWithOpenAi
} from "./openai-card-generator";

const config: OpenAiEnabledFallbackConfig = {
  enabled: true,
  baseUrl: "https://api.openai.example/v1",
  textApiKey: "text-secret",
  textModel: "gpt-5-nano",
  imageApiKey: "image-secret",
  imageModel: "gpt-image-1-mini"
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init
  });
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
    const imageBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
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
    expect(body.prompt).toContain("Dog Meds");
    expect(body.prompt).toMatch(/warm pale background/i);
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
