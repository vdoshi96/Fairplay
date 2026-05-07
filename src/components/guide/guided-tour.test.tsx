import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
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

function installTargetGeometry({
  height,
  left,
  top,
  viewportHeight,
  viewportWidth,
  width
}: {
  height: number;
  left: number;
  top: number;
  viewportHeight: number;
  viewportWidth: number;
  width: number;
}) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function getBoundingClientRect(this: HTMLElement) {
      if (this.dataset.guideId) {
        return {
          bottom: top + height,
          height,
          left,
          right: left + width,
          top,
          width,
          x: left,
          y: top,
          toJSON: () => ({})
        };
      }

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
    }
  );
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: viewportHeight
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: viewportWidth
  });
}

function installTargetAndDialogGeometry({
  dialogHeight,
  target,
  viewportHeight,
  viewportWidth
}: {
  dialogHeight: number;
  target: {
    height: number;
    left: number;
    top: number;
    width: number;
  };
  viewportHeight: number;
  viewportWidth: number;
}) {
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    function getBoundingClientRect(this: HTMLElement) {
      if (this.dataset.guideId) {
        return {
          bottom: target.top + target.height,
          height: target.height,
          left: target.left,
          right: target.left + target.width,
          top: target.top,
          width: target.width,
          x: target.left,
          y: target.top,
          toJSON: () => ({})
        };
      }

      if (this.getAttribute("role") === "dialog") {
        return {
          bottom: 16 + dialogHeight,
          height: dialogHeight,
          left: 16,
          right: 496,
          top: 16,
          width: 480,
          x: 16,
          y: 16,
          toJSON: () => ({})
        };
      }

      return {
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
        x: 0,
        y: 0,
        toJSON: () => ({})
      };
    }
  );
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: viewportHeight
  });
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: viewportWidth
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
                actionLabel: "Move dummy card to Alex",
                completionMessage: "Dummy card moved to Alex.",
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
    expect(
      screen.getByText("Next required click: Move dummy card to Alex.")
    ).toBeVisible();

    await userEvent.click(
      screen.getByRole("button", { name: "Move dummy card to Alex" })
    );

    expect(handlePracticeRequest).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Dummy card moved to Alex.")).toBeVisible();
    expect(
      screen.queryByText("Next required click: Move dummy card to Alex.")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    window.removeEventListener(GUIDE_PRACTICE_REQUEST_EVENT, handlePracticeRequest);
  });

  it("requires every marker in a multi-step practice before advancing", async () => {
    installVisibleTargetGeometry();
    const multiStepPractice = [
      {
        id: "workflow",
        title: "Practice the full workflow",
        body: "Complete each page-level dummy action before continuing.",
        targetId: "load-map-move-target",
        practice: {
          actionLabel: "Start dummy workflow",
          completionMessage: "Dummy workflow complete.",
          eventId: "load-map-practice-start",
          prompt: "Use the page-level dummy workflow.",
          requiredEventIds: [
            "load-map-move",
            "load-map-edit",
            "load-map-trim"
          ]
        }
      },
      steps[0]
    ] as unknown as GuideStep[];
    render(
      <div>
        <button data-guide-id="load-map-move-target">Move menu target</button>
        <GuidedTour
          featureName="Load Map"
          onExit={vi.fn()}
          steps={multiStepPractice}
        />
      </div>
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    act(() => completeGuidePractice("load-map-move"));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Practice progress: 1 of 3")).toBeVisible();

    act(() => completeGuidePractice("load-map-edit"));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByText("Practice progress: 2 of 3")).toBeVisible();

    act(() => completeGuidePractice("load-map-trim"));
    expect(screen.getByText("Dummy workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("blocks live background controls during required practice while exit controls still work", () => {
    installVisibleTargetGeometry();
    const onExit = vi.fn();
    const onLiveControl = vi.fn();

    render(
      <div>
        <button data-guide-id="load-map-move-target" onClick={onLiveControl}>
          Live production move
        </button>
        <GuidedTour
          featureName="Load Map"
          onExit={onExit}
          steps={[
            {
              id: "move",
              title: "Practice moving a card",
              body: "Move a pretend card before continuing.",
              targetId: "load-map-move-target",
              practice: {
                actionLabel: "Start dummy workflow",
                completionMessage: "Dummy workflow complete.",
                eventId: "load-map-practice-start",
                prompt: "Use the page-level dummy workflow.",
                requiredEventIds: ["load-map-move"]
              }
            }
          ]}
        />
      </div>
    );

    const backdrop = screen.getByLabelText("Guided tour backdrop");
    expect(backdrop.parentElement?.className).not.toContain("pointer-events-none");
    expect(backdrop.className).not.toContain("pointer-events-none");

    fireEvent.click(backdrop);
    expect(onLiveControl).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Skip" }));
    expect(onExit).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onExit).toHaveBeenCalledTimes(2);
  });

  it("uses theme-aware surface classes for the guide dialog and practice prompt", () => {
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
                actionLabel: "Start dummy workflow",
                completionMessage: "Dummy workflow complete.",
                eventId: "load-map-practice-start",
                prompt: "Use the page-level dummy workflow.",
                requiredEventIds: ["load-map-move"]
              }
            }
          ]}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Load Map guide" });
    const practiceButton = screen.getByRole("button", {
      name: "Start dummy workflow"
    });

    expect(dialog).toHaveClass("bg-[var(--fp-surface-strong)]");
    expect(dialog.className).not.toContain("bg-white");
    expect(practiceButton).toHaveClass("bg-[var(--fp-surface-strong)]");
    expect(practiceButton.className).not.toContain("bg-white");
  });

  it("opens only the required practice surface through the backdrop after launch", async () => {
    installVisibleTargetGeometry();
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <section data-guide-practice-surface>Dummy page-level practice</section>
        <GuidedTour
          featureName="Load Map"
          onExit={vi.fn()}
          steps={[
            {
              id: "practice",
              title: "Practice workflow",
              body: "Use the page-level dummy workflow.",
              targetId: "load-map-board",
              practice: {
                actionLabel: "Start dummy workflow",
                completionMessage: "Dummy workflow complete.",
                eventId: "load-map-practice-start",
                prompt: "Use the page-level dummy workflow.",
                requiredEventIds: ["load-map-move"]
              }
            }
          ]}
        />
      </div>
    );

    const backdrop = screen.getByLabelText("Guided tour backdrop");
    expect(backdrop.className).not.toContain("pointer-events-none");

    fireEvent.click(screen.getByRole("button", { name: "Start dummy workflow" }));

    await waitFor(() =>
      expect(screen.getAllByTestId("guide-backdrop-blocker")).toHaveLength(4)
    );
    expect(screen.getByLabelText("Guided tour backdrop").className).not.toContain(
      "pointer-events-none"
    );
  });

  it("keeps a top-edge target dialog below the safe viewport margin", () => {
    installTargetGeometry({
      height: 36,
      left: 280,
      top: 2,
      viewportHeight: 720,
      viewportWidth: 1024,
      width: 180
    });
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Load Map guide" });

    expect(Number.parseFloat(dialog.style.top)).toBeGreaterThanOrEqual(16);
    expect(dialog.style.bottom).toBe("");
    expect(Number.parseFloat(dialog.style.maxHeight)).toBeLessThanOrEqual(688);
    expect(
      Number.parseFloat(dialog.style.top) +
        Number.parseFloat(dialog.style.maxHeight)
    ).toBeLessThanOrEqual(720 - 16);
    expect(dialog).toHaveClass("overflow-hidden");
    expect(screen.getByTestId("guide-dialog-body")).toHaveClass(
      "overflow-y-auto"
    );
  });

  it("renders safe guide dialog placement defaults before effects measure the page", () => {
    const markup = renderToString(
      <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
    );

    expect(markup).toContain("top:16px");
    expect(markup).toContain("left:16px");
    expect(markup).toContain("max-height:calc(100dvh - 32px)");
    expect(markup).toContain("width:min(calc(100dvw - 32px), 480px)");
  });

  it("fits the guide dialog inside a constrained mobile viewport with internal scrolling", () => {
    installTargetGeometry({
      height: 36,
      left: 16,
      top: 48,
      viewportHeight: 360,
      viewportWidth: 320,
      width: 240
    });
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour
          featureName="Load Map"
          onExit={vi.fn()}
          steps={[
            {
              ...steps[0],
              body:
                "Cards in play live here so the household can see ownership. Use this short guide to understand what is visible and where decisions move next."
            }
          ]}
        />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Load Map guide" });
    const top = Number.parseFloat(dialog.style.top);
    const maxHeight = Number.parseFloat(dialog.style.maxHeight);

    expect(top).toBeGreaterThanOrEqual(16);
    expect(maxHeight).toBeLessThanOrEqual(328);
    expect(top + maxHeight).toBeLessThanOrEqual(360 - 16);
    expect(dialog.style.width).toBe("288px");
    expect(dialog).toHaveClass("overflow-hidden");
    const body = screen.getByTestId("guide-dialog-body");
    expect(body).toHaveClass("overflow-y-auto");
    expect(body).toHaveAttribute("tabindex", "0");
    expect(body).toHaveAccessibleName("This is the Load Map guide text");
    expect(
      screen.getByText(
        "Cards in play live here so the household can see ownership. Use this short guide to understand what is visible and where decisions move next."
      )
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Skip" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Done" })).toBeVisible();
  });

  it("uses the measured dialog height when choosing a collision-safe placement", () => {
    installTargetAndDialogGeometry({
      dialogHeight: 120,
      target: {
        height: 48,
        left: 900,
        top: 650,
        width: 96
      },
      viewportHeight: 720,
      viewportWidth: 1024
    });
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Load Map guide" });

    expect(dialog.style.top).toBe("510px");
    expect(dialog.style.maxHeight).toBe("194px");
    expect(dialog.style.width).toBe("480px");
  });

  it("collides away from a lower side target so the dialog remains visible", () => {
    installTargetGeometry({
      height: 48,
      left: 900,
      top: 650,
      viewportHeight: 720,
      viewportWidth: 1024,
      width: 96
    });
    render(
      <div>
        <button data-guide-id="load-map-board">Board target</button>
        <GuidedTour featureName="Load Map" onExit={vi.fn()} steps={steps} />
      </div>
    );

    const dialog = screen.getByRole("dialog", { name: "Load Map guide" });
    const top = Number.parseFloat(dialog.style.top);
    const left = Number.parseFloat(dialog.style.left);
    const maxHeight = Number.parseFloat(dialog.style.maxHeight);
    const width = Number.parseFloat(dialog.style.width);

    expect(top).toBeLessThan(650);
    expect(top).toBeGreaterThanOrEqual(16);
    expect(top + maxHeight).toBeLessThanOrEqual(720 - 16);
    expect(left).toBeGreaterThanOrEqual(16);
    expect(left + width).toBeLessThanOrEqual(1024 - 16);
  });
});
