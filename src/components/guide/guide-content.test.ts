import { describe, expect, it } from "vitest";

import { FEATURE_GUIDES } from "./guide-content";

describe("feature guide content", () => {
  it("requires at least one dummy practice action in every feature guide", () => {
    for (const guide of Object.values(FEATURE_GUIDES)) {
      expect(
        guide.steps.some((step) => Boolean(step.practice)),
        `${guide.id} should include a required practice step`
      ).toBe(true);
    }
  });

  it("teaches greg before source-card browsing in the Library guide", () => {
    expect(FEATURE_GUIDES.library.steps).toHaveLength(4);
    expect(FEATURE_GUIDES.library.steps[0]).toMatchObject({
      targetId: "library-ai-task-manager",
      title: "Use greg - the taskmaster",
      practice: {
        actionLabel: "Open greg in dummy mode"
      }
    });
  });

  it("uses precise guide targets for completion and movement actions", () => {
    expect(FEATURE_GUIDES.loadMap.steps.map((step) => step.targetId)).toContain(
      "load-map-move-target"
    );
    expect(FEATURE_GUIDES.checkIns.steps.map((step) => step.targetId)).toContain(
      "check-in-complete-action"
    );
    expect(FEATURE_GUIDES.checkIns.steps.map((step) => step.targetId)).not.toContain(
      "check-in-complete"
    );
  });

  it("keeps settings copy aligned with the learning hub", () => {
    const guidedStart = FEATURE_GUIDES.settings.steps.find(
      (step) => step.id === "guided-start"
    );

    expect(guidedStart?.body).toMatch(/learning hub/i);
    expect(guidedStart?.body).not.toMatch(/app guide/i);
  });
});
