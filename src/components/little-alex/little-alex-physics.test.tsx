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

function dispatchPointer(
  target: HTMLElement | Window,
  type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup",
  init: {
    clientX: number;
    clientY: number;
    pointerId?: number;
    timeStamp?: number;
  }
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: init.clientX,
    clientY: init.clientY
  });

  Object.defineProperty(event, "pointerId", {
    configurable: true,
    value: init.pointerId ?? 1
  });

  if (init.timeStamp !== undefined) {
    Object.defineProperty(event, "timeStamp", {
      configurable: true,
      value: init.timeStamp
    });
  }

  fireEvent(target, event);
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

  it("updates visible gaze state toward desktop pointer movement", () => {
    stubReducedMotion(false);
    stubViewport(1024, 768);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");

    expect(littleAlex).toHaveAttribute("data-gaze-direction", "center");
    expect(littleAlex.style.getPropertyValue("--little-alex-gaze-x")).toBe("0");

    dispatchPointer(window, "pointermove", {
      clientX: 80,
      clientY: 220,
      pointerId: 1
    });

    expect(littleAlex).toHaveAttribute("data-gaze-direction", "left");
    expect(Number(littleAlex.style.getPropertyValue("--little-alex-gaze-x"))).toBeLessThan(
      0
    );

    dispatchPointer(window, "pointermove", {
      clientX: 1000,
      clientY: 220,
      pointerId: 1
    });

    expect(littleAlex).toHaveAttribute("data-gaze-direction", "right");
    expect(
      Number(littleAlex.style.getPropertyValue("--little-alex-gaze-x"))
    ).toBeGreaterThan(0);
  });

  it("updates visible gaze state toward the last touched point", () => {
    stubReducedMotion(false);
    stubViewport(390, 720);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");

    fireEvent.touchStart(window, {
      changedTouches: [{ clientX: 24, clientY: 420 }],
      touches: [{ clientX: 24, clientY: 420 }]
    });

    expect(littleAlex).toHaveAttribute("data-gaze-direction", "left");
    expect(Number(littleAlex.style.getPropertyValue("--little-alex-gaze-x"))).toBeLessThan(
      0
    );

    fireEvent.touchMove(window, {
      changedTouches: [{ clientX: 370, clientY: 120 }],
      touches: [
        { clientX: 24, clientY: 420 },
        { clientX: 370, clientY: 120 }
      ]
    });

    expect(littleAlex).toHaveAttribute("data-gaze-direction", "right");
    expect(
      Number(littleAlex.style.getPropertyValue("--little-alex-gaze-x"))
    ).toBeGreaterThan(0);
  });

  it("does not show the chat bubble for a simple click release", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics chatPhrase="well done everyone" />);
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointerup", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 16
    });

    expect(screen.queryByTestId("little-alex-chat-bubble")).not.toBeInTheDocument();
  });

  it("shows the configured chat bubble after a real drag or fling", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics chatPhrase="well done everyone" />);
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 820,
      clientY: 260,
      pointerId: 1,
      timeStamp: 80
    });
    dispatchPointer(grabTarget, "pointerup", {
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

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "paused");

    act(() => {
      vi.advanceTimersByTime(900);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "walking");
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

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });
    dispatchPointer(grabTarget, "pointerup", {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });

    expect(littleAlex).toHaveStyle({ pointerEvents: "none" });
    expect(grabTarget).toHaveStyle({ pointerEvents: "auto" });
    expect(torso?.style.transform).not.toBe(initialTransform);
  });
});
