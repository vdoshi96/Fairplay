import { existsSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CardTemplateDetailSchema } from "../contracts/card-templates";
import { FAIRPLAY_SOURCE_CARDS, FAIRPLAY_SOURCE_VERSION } from "./fairplay-source-cards";

describe("FAIRPLAY_SOURCE_CARDS", () => {
  it("contains the full personal-use deck with unique slugs", () => {
    expect(FAIRPLAY_SOURCE_VERSION).toBe("trello-fairplay-copy-2026-05-04");
    expect(FAIRPLAY_SOURCE_CARDS).toHaveLength(100);

    const slugs = new Set(FAIRPLAY_SOURCE_CARDS.map((card) => card.slug));
    const sourceIds = new Set(FAIRPLAY_SOURCE_CARDS.map((card) => card.sourceCardId));

    expect(slugs.size).toBe(100);
    expect(sourceIds.size).toBe(100);
  });

  it("has CPE, standard, labels, a default Not in Play lane, and local cover asset for every card", () => {
    for (const card of FAIRPLAY_SOURCE_CARDS) {
      const parsed = CardTemplateDetailSchema.parse(card);

      expect(parsed.defaultLane).toBe("not_in_play");
      expect(parsed.definition.length).toBeGreaterThan(10);
      expect(parsed.conception.length).toBeGreaterThan(10);
      expect(parsed.planning.length).toBeGreaterThan(10);
      expect(parsed.execution.length).toBeGreaterThan(10);
      expect(parsed.minimumStandard.length).toBeGreaterThan(10);
      expect(parsed.labels.length).toBeGreaterThan(0);
      expect(parsed.coverAssetPath).toBe(`/assets/fairplay/cards/${parsed.slug}.png`);
      expect(existsSync(join(process.cwd(), "public", parsed.coverAssetPath))).toBe(true);
    }
  });

  it("does not expose remote Trello attachment URLs in runtime seed data", () => {
    expect(JSON.stringify(FAIRPLAY_SOURCE_CARDS)).not.toMatch(/https?:|trello\.com/i);
  });
});
