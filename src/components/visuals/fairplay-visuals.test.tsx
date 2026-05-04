import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CheckInVisual,
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
      "/assets/fairplay/alex-avatar.svg"
    );
    expect(screen.getByRole("img", { name: "Max avatar" })).toHaveAttribute(
      "src",
      "/assets/fairplay/max-avatar.svg"
    );
  });

  it("allows visuals to be marked decorative with empty alt text", () => {
    render(<HelperMascot decorative />);

    const mascot = screen.getByAltText("");
    expect(mascot).toHaveAttribute("aria-hidden", "true");
    expect(mascot).toHaveAttribute("src", "/assets/fairplay/helper-mascot.svg");
  });

  it("uses a calm accessible label for the radar illustration", () => {
    render(<RadarVisual />);

    expect(
      screen.getByRole("img", { name: "Shared radar illustration" })
    ).toHaveAttribute("src", "/assets/fairplay/radar-board-placeholder.svg");
  });

  it("renders the check-in visual as non-image spark pieces", () => {
    render(<CheckInVisual label="Check-in completion spark" />);

    expect(
      screen.getByRole("img", { name: "Check-in completion spark" })
    ).toHaveAttribute("data-fp-visual", "check-in");
    expect(screen.getAllByTestId("check-in-spark-piece")).toHaveLength(6);
  });
});
