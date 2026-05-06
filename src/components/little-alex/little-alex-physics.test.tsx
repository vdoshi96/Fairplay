import { act, fireEvent, render, screen } from "@testing-library/react";
import Matter from "matter-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LittleAlexPhysics } from "./little-alex-physics";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query === reducedMotionQuery ? matches : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn()
    }))
  );
}

function stubPointerCapture() {
  Object.defineProperties(HTMLElement.prototype, {
    hasPointerCapture: {
      configurable: true,
      value: vi.fn(() => true)
    },
    releasePointerCapture: {
      configurable: true,
      value: vi.fn()
    },
    setPointerCapture: {
      configurable: true,
      value: vi.fn()
    }
  });
}

function stubViewport(width: number, height: number) {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
}

describe("LittleAlexPhysics", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("starts the Matter.js runner for the normal physics mode", () => {
    stubReducedMotion(false);
    const runSpy = vi
      .spyOn(Matter.Runner, "run")
      .mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);

    expect(screen.getByTestId("little-alex-horne")).toHaveAttribute(
      "data-motion-mode",
      "physics"
    );
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("does not start continuous physics when reduced motion is requested", () => {
    stubReducedMotion(true);
    const runSpy = vi
      .spyOn(Matter.Runner, "run")
      .mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);

    expect(screen.getByTestId("little-alex-horne")).toHaveAttribute(
      "data-motion-mode",
      "reduced"
    );
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("uses the actual small viewport dimensions for physics walls", () => {
    stubReducedMotion(false);
    stubViewport(300, 260);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());
    const rectangleSpy = vi.spyOn(Matter.Bodies, "rectangle");

    render(<LittleAlexPhysics />);

    const wallCalls = rectangleSpy.mock.calls.filter(
      ([, , , , options]) => options?.isStatic === true
    );

    expect(wallCalls).toEqual([
      [150, -48, 492, 96, { isStatic: true }],
      [150, 308, 492, 96, { isStatic: true }],
      [-48, 130, 96, 452, { isStatic: true }],
      [348, 130, 96, 452, { isStatic: true }]
    ]);
  });

  it("uses a roughly ten percent faster fall rate", () => {
    stubReducedMotion(false);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());
    const createSpy = vi.spyOn(Matter.Engine, "create");

    render(<LittleAlexPhysics />);

    const engine = createSpy.mock.results[0]?.value;
    expect(engine.gravity.y).toBeCloseTo(0.902, 3);
  });

  it("shows the configured chat bubble after every fling", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics chatPhrase="well done everyone" />);
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    fireEvent.pointerDown(grabTarget, {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    fireEvent.pointerMove(grabTarget, {
      clientX: 820,
      clientY: 260,
      pointerId: 1,
      timeStamp: 80
    });
    fireEvent.pointerUp(grabTarget, {
      clientX: 820,
      clientY: 260,
      pointerId: 1,
      timeStamp: 96
    });

    const bubble = screen.getByTestId("little-alex-chat-bubble");

    expect(bubble).toHaveTextContent("well done everyone");
    expect(bubble.style.transform).toContain("translate3d");
  });

  it("stands upright and starts slow idle walking after five seconds untouched", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");

    expect(littleAlex).toHaveAttribute("data-idle-state", "active");

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "walking");
    expect(screen.getByTestId("little-alex-grab-target")).toHaveStyle({
      pointerEvents: "auto"
    });
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function)
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "touchstart",
      expect.any(Function),
      { passive: true }
    );
  });

  it("does not run idle walking in reduced motion", () => {
    vi.useFakeTimers();
    stubReducedMotion(true);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");

    act(() => {
      vi.advanceTimersByTime(6_000);
    });

    expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");
    expect(littleAlex).toHaveAttribute("data-idle-state", "static");
  });

  it("maps appearance options to gender and skin CSS without changing suit assets", () => {
    stubReducedMotion(true);

    render(
      <LittleAlexPhysics
        genderPresentation="feminine"
        skinTone="tone_4"
      />
    );

    const littleAlex = screen.getByTestId("little-alex-horne");

    expect(littleAlex).toHaveAttribute("data-gender-presentation", "feminine");
    expect(littleAlex).toHaveStyle({ "--little-alex-skin": "#b7795f" });
    expect(screen.getByTestId("little-alex-clipboard")).toBeInTheDocument();
    expect(screen.getByTestId("little-alex-shirt")).toBeInTheDocument();
  });

  it("keeps the reduced-motion object safely draggable without enabling the shell", () => {
    stubReducedMotion(true);
    stubPointerCapture();

    const { container } = render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const grabTarget = screen.getByTestId("little-alex-grab-target");
    const torso = container.querySelector<HTMLElement>('[data-part="torso"]');

    expect(torso).not.toBeNull();
    const initialTransform = torso?.style.transform;

    fireEvent.pointerDown(grabTarget, {
      clientX: 900,
      clientY: 200,
      pointerId: 1
    });
    fireEvent.pointerMove(grabTarget, {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });
    fireEvent.pointerUp(grabTarget, {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });

    expect(littleAlex).toHaveStyle({ pointerEvents: "none" });
    expect(grabTarget).toHaveStyle({ pointerEvents: "auto" });
    expect(torso?.style.transform).not.toBe(initialTransform);
  });
});
