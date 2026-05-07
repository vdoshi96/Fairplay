import { describe, expect, it } from "vitest";

import {
  AiCardDraftCreateSchema,
  AiCardDraftSummarySchema,
  AiCardDraftUpdateSchema
} from "./ai-card-drafts";

describe("AiCardDraft contracts", () => {
  it("accepts text capture input and rejects missing text", () => {
    const create = AiCardDraftCreateSchema.parse({
      inputText: "Remember the dog's heartworm meds."
    });

    expect(create.inputText).toBe("Remember the dog's heartworm meds.");
    expect(() => AiCardDraftCreateSchema.parse({})).toThrow();
  });

  it("accepts tracker-ready summaries with generated cover API paths", () => {
    const summary = AiCardDraftSummarySchema.parse({
      id: "550e8400-e29b-41d4-a716-446655440090",
      title: "Pet medication rhythm",
      promptPreview: "Remember the dog's heartworm meds.",
      status: "ready",
      generationStage: "ready",
      sourceInputType: "text",
      summary: "Keep pet medication refills and monthly doses handled.",
      areaKeys: ["Home"],
      hiddenEffortKeys: ["noticing", "planning", "follow_through"],
      cadence: "monthly",
      coverAssetPath:
        "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440090/cover",
      failureMessage: null,
      acceptedResponsibilityId: null,
      createdAt: "2026-05-05T12:00:00.000Z",
      updatedAt: "2026-05-05T12:00:00.000Z"
    });

    expect(summary.status).toBe("ready");
    expect(summary.coverAssetPath).toBe(
      "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440090/cover"
    );
    expect(() =>
      AiCardDraftSummarySchema.parse({
        ...summary,
        coverAssetPath: "https://cdn.example/private-provider-url.png"
      })
    ).toThrow();
    expect(() =>
      AiCardDraftSummarySchema.parse({
        ...summary,
        generationStage: "generating_image"
      })
    ).toThrow();
  });

  it("accepts generated text field updates before put-in-play", () => {
    const update = AiCardDraftUpdateSchema.parse({
      title: "Pet meds",
      hiddenEffortKeys: ["follow_through"],
      cadence: "monthly"
    });

    expect(update).toEqual({
      title: "Pet meds",
      hiddenEffortKeys: ["follow_through"],
      cadence: "monthly"
    });
    expect(() =>
      AiCardDraftUpdateSchema.parse({
        imagePrompt: "A tidy pet medication calendar with a small pill organizer."
      })
    ).toThrow();
    expect(() =>
      AiCardDraftUpdateSchema.parse({
        cadence: null
      })
    ).toThrow();
  });
});
