import { describe, expect, it } from "vitest";

import {
  buildSourceCardCoverPrompt,
  sourceCardCoverNegativePrompt
} from "./visible-asset-prompts";

describe("visible asset prompts", () => {
  it("builds source-safe textless card cover prompts", () => {
    const prompt = buildSourceCardCoverPrompt({
      labels: ["Daily Grind", "Home"],
      summary: "Keep dishes moving through the kitchen before counters pile up.",
      title: "Dishes"
    });

    expect(prompt).toContain("flat 2D vector illustration");
    expect(prompt).toContain("Object cues: plate, cup, and simple rinse sparkle");
    expect(prompt).toContain("no readable text");
    expect(prompt).toContain("Do not imitate public decks");
    expect(prompt).not.toContain("Private semantic theme");
    expect(prompt.toLowerCase()).not.toContain("dishes");
    expect(prompt).not.toContain("route line");
    expect(prompt).not.toContain("card because");
    expect(prompt).not.toContain("Source card marker");
  });

  it("keeps hard negative prompts away from source deck mimicry", () => {
    expect(sourceCardCoverNegativePrompt).toContain("playing card");
    expect(sourceCardCoverNegativePrompt).toContain("source deck style");
    expect(sourceCardCoverNegativePrompt).toContain("readable text");
  });

  it("prioritizes title-derived generic cues without leaking the title", () => {
    const prompt = buildSourceCardCoverPrompt({
      labels: ["Happiness Trio", "Magic"],
      summary:
        "Each person keeps friendships visible because friends support health, happiness, resilience, career, and sanity.",
      title: "Adult Friendships (Alex)"
    });

    expect(prompt).toContain("connected dots and shared table object");
    expect(prompt).not.toContain("medicine organizer");
    expect(prompt).not.toContain("Adult Friendships");
  });
});
