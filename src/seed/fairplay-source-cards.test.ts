import { existsSync, readFileSync } from "node:fs";
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
      const coverPath = join(process.cwd(), "public", parsed.coverAssetPath);
      expect(existsSync(coverPath)).toBe(true);
      expect(pngDimensions(readFileSync(coverPath))).toEqual({
        height: 700,
        width: 500
      });
    }
  });

  it("does not expose remote Trello attachment URLs in runtime seed data", () => {
    expect(JSON.stringify(FAIRPLAY_SOURCE_CARDS)).not.toMatch(/https?:|trello\.com/i);
  });

  it("uses Alex and Max in user-facing duplicate-card display fields while preserving stable slugs and asset paths", () => {
    const displayText = FAIRPLAY_SOURCE_CARDS.map((card) =>
      [
        card.title,
        card.summary,
        card.definition,
        card.conception,
        card.planning,
        card.execution,
        card.minimumStandard
      ].join(" ")
    ).join(" ");

    expect(displayText).not.toMatch(/Player 1|Player 2|PLAYER ONE|PLAYER TWO/);
    expect(displayText).toContain("Adult Friendships (Alex)");
    expect(displayText).toContain("Adult Friendships (Max)");
    expect(displayText).toContain("BEAUTY & WARDROBE (ALEX)");
    expect(displayText).toContain("GROOMING & WARDROBE (MAX)");

    expect(
      FAIRPLAY_SOURCE_CARDS.find((card) => card.slug === "adult-friendships-player-1")
    ).toMatchObject({
      coverAssetPath: "/assets/fairplay/cards/adult-friendships-player-1.png",
      id: "tpl_adult-friendships-player-1",
      title: "Adult Friendships (Alex)"
    });
    expect(
      FAIRPLAY_SOURCE_CARDS.find((card) => card.slug === "adult-friendships-player-2")
    ).toMatchObject({
      coverAssetPath: "/assets/fairplay/cards/adult-friendships-player-2.png",
      id: "tpl_adult-friendships-player-2",
      title: "Adult Friendships (Max)"
    });
  });
});

function pngDimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  expect(bytes.subarray(12, 16).toString("ascii")).toBe("IHDR");

  return {
    height: bytes.readUInt32BE(20),
    width: bytes.readUInt32BE(16)
  };
}
