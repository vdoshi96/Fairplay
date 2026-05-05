import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedTour, type GuideStep } from "./guided-tour";

const steps: GuideStep[] = [
  {
    id: "first",
    title: "This is the Load Map",
    body: "Cards in play live here so the household can see ownership.",
    targetId: "load-map-board"
  },
  {
    id: "second",
    title: "Move cards deliberately",
    body: "Use drag and drop or the move menu when the lane decision changes.",
    targetId: "move-menu"
  }
];

describe("GuidedTour", () => {
  it("shows a coach bubble, highlights the active target, and blocks background clicks", () => {
    const onBackgroundClick = vi.fn();
    render(
      <div>
        <button data-guide-id="load-map-board" onClick={onBackgroundClick}>
          Board target
        </button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    expect(screen.getByRole("dialog", { name: "Load Map guide" })).toBeVisible();
    expect(screen.getByText("This is the Load Map")).toBeVisible();
    expect(screen.getByText("Step 1 of 2")).toBeVisible();
    expect(screen.getByTestId("guide-highlight")).toBeVisible();

    fireEvent.click(screen.getByLabelText("Guided tour backdrop"));

    expect(onBackgroundClick).not.toHaveBeenCalled();
  });

  it("moves forward and backward through steps", () => {
    render(<GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Move cards deliberately")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("This is the Load Map")).toBeVisible();
  });

  it("exits through skip, done, and Escape", () => {
    const onExit = vi.fn();
    const { rerender } = render(
      <GuidedTour featureName="Load Map" onExit={onExit} steps={steps} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onExit).toHaveBeenCalledTimes(1);

    rerender(<GuidedTour featureName="Load Map" onExit={onExit} steps={[steps[0]]} />);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onExit).toHaveBeenCalledTimes(2);

    rerender(<GuidedTour featureName="Load Map" onExit={onExit} steps={steps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(3);
  });

  it("uses a friendly fallback when a target is missing", () => {
    render(
      <GuidedTour
        featureName="Library"
        onExit={vi.fn()}
        steps={[
          {
            id: "missing",
            title: "Search cards",
            body: "Use search to find a source card.",
            targetId: "not-present"
          }
        ]}
      />
    );

    expect(screen.getByText("Search cards")).toBeVisible();
    expect(
      screen.getByText("This part of the page is not visible right now.")
    ).toBeVisible();
  });
});
