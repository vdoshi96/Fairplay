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

  it("requires page-level multi-action practice for every feature guide", () => {
    const expectedRequiredEvents = {
      loadMap: [
        "load-map-move",
        "load-map-edit",
        "load-map-trim",
        "load-map-delete"
      ],
      library: [
        "library-capture-filled",
        "library-draft-reviewed",
        "library-draft-edited",
        "library-put-in-play"
      ],
      checkIns: [
        "check-in-scheduled",
        "check-in-complete",
        "check-in-notes-updated"
      ],
      settings: [
        "settings-appearance-mode",
        "settings-welcome-replay",
        "settings-persona-confirm",
        "settings-learning-hub"
      ]
    };

    for (const [guideId, requiredEvents] of Object.entries(expectedRequiredEvents)) {
      const guide = FEATURE_GUIDES[guideId as keyof typeof FEATURE_GUIDES];
      const practiceStep = guide.steps.find((step) => Boolean(step.practice));
      const practice = practiceStep?.practice as
        | { requiredEventIds?: string[] }
        | undefined;

      expect(practice?.requiredEventIds, guideId).toEqual(requiredEvents);
    }
  });

  it("teaches temporary feature practice before source-card browsing in the Library guide", () => {
    expect(FEATURE_GUIDES.library.steps).toHaveLength(4);
    expect(FEATURE_GUIDES.library.steps[0]).toMatchObject({
      targetId: "library-ai-task-manager",
      title: "Practice first",
      practice: {
        actionLabel: "Start practice"
      }
    });
    expect(FEATURE_GUIDES.library.steps[0].body).toMatch(/temporary/i);
    expect(FEATURE_GUIDES.library.steps[0].body).toMatch(/Nothing permanent/i);
  });

  it("explains what learners practice and why in the Board first step", () => {
    expect(FEATURE_GUIDES.loadMap.steps[0].title).toBe("About this feature");
    expect(FEATURE_GUIDES.loadMap.steps[0].body).toMatch(/practice/i);
    expect(FEATURE_GUIDES.loadMap.steps[0].body).toMatch(/why/i);
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

  it("starts Settings on a clear feature overview before persona controls", () => {
    expect(FEATURE_GUIDES.settings.steps[0]).toMatchObject({
      id: "overview",
      targetId: "settings-overview",
      title: "About this feature"
    });
    expect(FEATURE_GUIDES.settings.steps[0].body).toMatch(/settings/i);
    expect(FEATURE_GUIDES.settings.steps[0].body).toMatch(/appearance/i);
    expect(FEATURE_GUIDES.settings.steps[0].body).toMatch(/learning/i);
  });

  it("keeps Check-ins focused on scheduling, confirmation, and notes", () => {
    expect(FEATURE_GUIDES.checkIns.steps[0]).toMatchObject({
      id: "overview",
      targetId: "check-in-overview",
      title: "About this feature"
    });
    expect(FEATURE_GUIDES.checkIns.steps[0].body).toMatch(/check-ins/i);
    expect(FEATURE_GUIDES.checkIns.steps[0].body).toMatch(/schedule/i);
    expect(FEATURE_GUIDES.checkIns.steps[0].body).toMatch(/notes/i);

    const practice = FEATURE_GUIDES.checkIns.steps.find(
      (step) => step.practice
    )?.practice;
    expect(practice?.actionLabel).toBe("Start practice");
    expect(practice?.prompt).toMatch(/scheduling/i);
    expect(practice?.prompt).toMatch(/confirming/i);
    expect(practice?.prompt).toMatch(/notes/i);
  });

  it("keeps settings copy aligned with the learning hub", () => {
    const guidedStart = FEATURE_GUIDES.settings.steps.find(
      (step) => step.id === "guided-start"
    );

    expect(guidedStart?.body).toMatch(/learning hub/i);
    expect(guidedStart?.body).not.toMatch(/app guide/i);
  });
});
