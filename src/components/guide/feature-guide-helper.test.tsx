import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureGuideHelper } from "./feature-guide-helper";
import type { FeatureGuideId } from "./guide-content";

const helperExpectations: Array<{
  guideId: FeatureGuideId;
  label: string;
  scene: string;
}> = [
  {
    guideId: "loadMap",
    label: "Load Map helper scene",
    scene: "lane-board"
  },
  {
    guideId: "library",
    label: "Library helper scene",
    scene: "card-shelf"
  },
  {
    guideId: "radar",
    label: "Radar helper scene",
    scene: "signal-radar"
  },
  {
    guideId: "checkIns",
    label: "Check-ins helper scene",
    scene: "decision-table"
  },
  {
    guideId: "settings",
    label: "Settings helper scene",
    scene: "control-panel"
  }
];

describe("FeatureGuideHelper", () => {
  it("renders a distinct helper scenelet for each guided feature", () => {
    render(
      <>
        {helperExpectations.map(({ guideId }) => (
          <FeatureGuideHelper guideId={guideId} key={guideId} />
        ))}
      </>
    );

    const renderedScenes = helperExpectations.map(({ guideId, label, scene }) => {
      const helper = screen.getByRole("img", { name: label });

      expect(helper).toHaveAttribute("data-testid", `feature-guide-helper-${guideId}`);
      expect(helper).toHaveAttribute("data-helper-scene", scene);

      return helper.getAttribute("data-helper-scene");
    });

    expect(new Set(renderedScenes).size).toBe(helperExpectations.length);
  });
});
