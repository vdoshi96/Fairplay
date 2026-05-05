import { describe, expect, it } from "vitest";

import {
  AiCardDraftCreateSchema,
  AiCardDraftSummarySchema,
  AiCardDraftUpdateSchema
} from "./ai-card-drafts";

describe("AiCardDraft contracts", () => {
  it("accepts text capture input and rejects missing text/audio", () => {
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
      coverUrl: "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440090/cover",
      failureMessage: null,
      acceptedResponsibilityId: null,
      createdAt: "2026-05-05T12:00:00.000Z",
      updatedAt: "2026-05-05T12:00:00.000Z"
    });

    expect(summary.status).toBe("ready");
    expect(summary.coverUrl).toBe(
      "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440090/cover"
    );
  });

  it("accepts generated field updates before put-in-play", () => {
    const update = AiCardDraftUpdateSchema.parse({
      title: "Pet meds",
      hiddenEffortKeys: ["follow_through"],
      cadence: "monthly",
      imagePrompt: "A tidy pet medication calendar with a small pill organizer.",
      imageNegativePrompt: "No brand names, no cluttered countertop."
    });

    expect(update).toEqual({
      title: "Pet meds",
      hiddenEffortKeys: ["follow_through"],
      cadence: "monthly",
      imagePrompt: "A tidy pet medication calendar with a small pill organizer.",
      imageNegativePrompt: "No brand names, no cluttered countertop."
    });
  });
});
