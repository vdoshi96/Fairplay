import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  completeGuidePractice,
  GUIDE_PRACTICE_REQUEST_EVENT
} from "./guide-practice";
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

function installVisibleTargetGeometry() {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    bottom: 64,
    height: 40,
    left: 24,
    right: 224,
    top: 24,
    width: 200,
    x: 24,
    y: 24,
    toJSON: () => ({})
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: 768
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: 1024
  });
}

describe("GuidedTour", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a coach bubble, highlights the active target, and blocks background clicks", () => {
    installVisibleTargetGeometry();
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
    installVisibleTargetGeometry();
    render(<GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Move cards deliberately")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByText("This is the Load Map")).toBeVisible();
  });

  it("exits through skip, done, and Escape", () => {
    installVisibleTargetGeometry();
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

  it("scrolls the active target into view before measuring the highlight", () => {
    installVisibleTargetGeometry();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView
    });

    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    expect(scrollIntoView).toHaveBeenCalledWith({
      block: "center",
      inline: "nearest"
    });
    expect(screen.getByTestId("guide-highlight")).toBeVisible();
  });

  it("does not highlight zero-sized or offscreen targets", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 0,
      height: 0,
      left: -40,
      right: -40,
      top: -40,
      width: 0,
      x: -40,
      y: -40,
      toJSON: () => ({})
    });
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    expect(screen.queryByTestId("guide-highlight")).not.toBeInTheDocument();
    expect(
      screen.getByText("This part of the page is not visible right now.")
    ).toBeVisible();
  });

  it("forces required dummy practice before advancing", async () => {
    installVisibleTargetGeometry();
    render(
      <div>
        <button data-guide-id="load-map-move-target">Move menu target</button>
        <GuidedTour
          featureName="Load Map"
          onExit={vi.fn()}
          steps={[
            {
              id: "move",
              title: "Practice moving a card",
              body: "Move a pretend card before continuing.",
              targetId: "load-map-move-target",
              practice: {
                actionLabel: "Move dummy card to Player 1",
                completionMessage: "Dummy card moved to Player 1.",
                eventId: "load-map-move",
                prompt: "Move the dummy card without changing your real board."
              }
            },
            steps[0]
          ]}
        />
      </div>
    );
    const handlePracticeRequest = vi.fn((event: Event) => {
      expect((event as CustomEvent<{ eventId: string }>).detail.eventId)
        .toBe("load-map-move");
      completeGuidePractice("load-map-move");
    });
    window.addEventListener(GUIDE_PRACTICE_REQUEST_EVENT, handlePracticeRequest);

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Move the dummy card without changing your real board.")
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Move dummy card to Player 1" })
    );

    expect(handlePracticeRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Dummy card moved to Player 1.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    window.removeEventListener(GUIDE_PRACTICE_REQUEST_EVENT, handlePracticeRequest);
  });
});
