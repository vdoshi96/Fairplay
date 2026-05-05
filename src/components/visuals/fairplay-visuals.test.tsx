import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CheckInVisual,
  FairplayMark,
  HelperMascot,
  PersonaAvatar,
  RadarVisual
} from "./fairplay-visuals";

describe("Fairplay visual components", () => {
  it("renders persona avatars with accessible labels by default", () => {
    render(
      <>
        <PersonaAvatar persona="alex" />
        <PersonaAvatar persona="max" />
      </>
    );

    expect(screen.getByRole("img", { name: "Alex avatar" })).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/alex-avatar.png"
    );
    expect(screen.getByRole("img", { name: "Max avatar" })).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/max-avatar.png"
    );
  });

  it("allows visuals to be marked decorative with empty alt text", () => {
    render(<HelperMascot decorative />);

    const mascot = screen.getByAltText("");
    expect(mascot).toHaveAttribute("aria-hidden", "true");
    expect(mascot).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/helper-mascot.png"
    );
    expect(mascot).toHaveAttribute("draggable", "false");
  });

  it("uses a calm accessible label for the radar illustration", () => {
    render(<RadarVisual />);

    expect(
      screen.getByRole("img", { name: "Shared radar illustration" })
    ).toHaveAttribute("src", "/assets/fairplay/generated-ui/radar-illustration.png");
  });

  it("uses the generated Fairplay mark asset", () => {
    render(<FairplayMark />);

    expect(
      screen.getByRole("img", { name: "Fairplay household orbit mark" })
    ).toHaveAttribute("src", "/assets/fairplay/generated-ui/fairplay-mark.png");
  });

  it("renders the check-in visual as a generated image", () => {
    render(<CheckInVisual label="Check-in completion spark" />);

    expect(
      screen.getByRole("img", { name: "Check-in completion spark" })
    ).toHaveAttribute("src", "/assets/fairplay/generated-ui/check-in-spark.png");
  });
});
