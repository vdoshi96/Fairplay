import { describe, expect, it } from "vitest";

import {
  CardTemplateDetailSchema,
  CardTemplateLabelSchema,
  CardTemplateSummarySchema
} from "./card-templates";

describe("CardTemplate contracts", () => {
  it("accepts source card detail with CPE and local cover metadata", () => {
    const detail = CardTemplateDetailSchema.parse({
      id: "tpl_auto",
      sourceCardId: "trello_auto",
      slug: "auto",
      title: "Auto",
      labels: ["Out", "Daily Grind"],
      summary: "Vehicle responsibility summary.",
      definition: "Keep vehicle needs visible and handled.",
      conception: "Notice repairs, documents, fuel, and timing.",
      planning: "Schedule service, gather records, and arrange transport.",
      execution: "Complete service, registration, refuel, and follow-through.",
      minimumStandard: "The vehicle is available, legal, and safe enough for planned use.",
      coverAssetPath: "/assets/fairplay/cards/auto.png",
      defaultLane: "not_in_play",
      defaultCadence: "as_needed",
      hiddenEffortKeys: ["noticing", "planning", "doing", "follow_through"],
      sourceVersion: "trello-fairplay-copy-2026-05-04",
      importedAt: "2026-05-04T00:00:00.000Z"
    });

    expect(detail.defaultLane).toBe("not_in_play");
    expect(detail.coverAssetPath).toBe("/assets/fairplay/cards/auto.png");
    expect(detail.conception).toContain("Notice");
  });

  it("rejects unknown labels, remote covers, and incomplete summaries", () => {
    expect(() => CardTemplateLabelSchema.parse("Kitchen")).toThrow();
    expect(() =>
      CardTemplateSummarySchema.parse({
        id: "tpl_auto",
        slug: "auto",
        title: "Auto",
        labels: ["Out"],
        summary: "Vehicle responsibility summary.",
        ["cover" + "Url"]: "/assets/fairplay/cards/auto.png",
        defaultLane: "not_in_play"
      })
    ).toThrow();
    expect(() =>
      CardTemplateSummarySchema.parse({
        id: "tpl_auto",
        slug: "auto",
        title: "Auto",
        labels: ["Out"],
        summary: "Vehicle responsibility summary.",
        defaultLane: "not_in_play"
      })
    ).toThrow();
  });
});
