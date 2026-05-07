import { describe, expect, it } from "vitest";

import {
  cardSystemPrompt,
  StructuredAiCardSchema
} from "./card-generation-shared";

describe("card generation shared text contract", () => {
  it("structures cards as text-only JSON without image prompt fields", () => {
    const card = StructuredAiCardSchema.parse({
      title: "Pet Medication Rhythm",
      summary: "Keep pet medication refills and monthly doses handled.",
      areaKeys: ["pet_care"],
      hiddenEffortKeys: ["noticing", "planning", "follow_through"],
      cadence: "monthly",
      definition: "Track the refill and dose schedule.",
      conception: "Notice when the next dose or refill is coming up.",
      planning: "Put refill and dose dates on the household calendar.",
      execution: "Give the medicine and record it.",
      minimumStandard: "Medication is given by the due date."
    });

    expect(card).toMatchObject({
      title: "Pet Medication Rhythm",
      minimumStandard: "Medication is given by the due date."
    });
    expect(cardSystemPrompt).toMatch(/structured text/i);
    expect(cardSystemPrompt).not.toMatch(/imagePrompt|imageNegativePrompt|image/i);
  });
});
