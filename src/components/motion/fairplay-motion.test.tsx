import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AssignmentShift, MotionPanel, MotionSpark } from "./fairplay-motion";

describe("Fairplay motion helpers", () => {
  it("adds the reduced-motion-safe panel enter hook", () => {
    render(
      <MotionPanel>
        <p>Panel content</p>
      </MotionPanel>
    );

    expect(screen.getByText("Panel content").parentElement).toHaveClass(
      "fp-motion-panel-enter"
    );
  });

  it("renders assignment shift as labeled persona dots without score framing", () => {
    render(<AssignmentShift from="alex" to="max" label="Owner shift preview" />);

    const visual = screen.getByRole("img", { name: "Owner shift preview" });
    expect(visual).toHaveAttribute("data-fp-motion", "assignment-shift");
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.queryByText(/score|winner|loser/i)).not.toBeInTheDocument();
  });

  it("marks decorative sparks as hidden from assistive technology", () => {
    render(<MotionSpark decorative />);

    expect(screen.getByTestId("motion-spark")).toHaveAttribute("aria-hidden", "true");
  });
});
