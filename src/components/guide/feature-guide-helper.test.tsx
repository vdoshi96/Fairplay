import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureGuideHelper } from "./feature-guide-helper";
import type { FeatureGuideId } from "./guide-content";

const helperExpectations: Array<{
  guideId: FeatureGuideId;
  label: string;
  scene: string;
  src: string;
}> = [
  {
    guideId: "loadMap",
    label: "Load Map helper scene",
    scene: "lane-board",
    src: "/assets/fairplay/generated-ui/feature-guide/load-map.png"
  },
  {
    guideId: "library",
    label: "Library helper scene",
    scene: "card-shelf",
    src: "/assets/fairplay/generated-ui/feature-guide/library.png"
  },
  {
    guideId: "checkIns",
    label: "Check-ins helper scene",
    scene: "decision-table",
    src: "/assets/fairplay/generated-ui/feature-guide/check-ins.png"
  },
  {
    guideId: "settings",
    label: "Settings helper scene",
    scene: "control-panel",
    src: "/assets/fairplay/generated-ui/feature-guide/settings.png"
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

    const renderedScenes = helperExpectations.map(({ guideId, label, scene, src }) => {
      const helper = screen.getByRole("img", { name: label });

      expect(helper).toHaveAttribute("data-testid", `feature-guide-helper-${guideId}`);
      expect(helper).toHaveAttribute("data-helper-scene", scene);
      expect(
        screen.getByTestId(`feature-guide-helper-image-${guideId}`)
      ).toHaveAttribute("src", src);

      return helper.getAttribute("data-helper-scene");
    });

    expect(new Set(renderedScenes).size).toBe(helperExpectations.length);
  });
});
