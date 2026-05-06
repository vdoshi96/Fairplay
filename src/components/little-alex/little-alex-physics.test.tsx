import { act, fireEvent, render, screen } from "@testing-library/react";
import Matter from "matter-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clampIdleWalkTurnToBounds,
  LittleAlexPhysics,
  nextIdleWalkTurn,
  playAreaBounds
} from "./little-alex-physics";

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

function translatedX(element: HTMLElement) {
  const match = element.style.transform.match(/translate3d\((-?\d+(?:\.\d+)?)px/);

  if (!match) {
    throw new Error(`Missing translate3d x value: ${element.style.transform}`);
  }

  return Number(match[1]);
}

function firePointer(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup",
  options: { clientX: number; clientY: number; pointerId: number; timeStamp?: number }
) {
  const event = new Event(type, { bubbles: true, cancelable: true });

  Object.defineProperties(event, {
    clientX: { value: options.clientX },
    clientY: { value: options.clientY },
    pageX: { value: options.clientX },
    pageY: { value: options.clientY },
    pointerId: { value: options.pointerId },
    screenX: { value: options.clientX },
    screenY: { value: options.clientY },
    timeStamp: { value: options.timeStamp ?? 0 }
  });

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

  it("shows the configured chat bubble after every fling", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics chatPhrase="well done everyone" />);
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    firePointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    firePointer(grabTarget, "pointermove", {
      clientX: 820,
      clientY: 260,
      pointerId: 1,
      timeStamp: 80
    });
    firePointer(grabTarget, "pointerup", {
      clientX: 820,
      clientY: 260,
      pointerId: 1,
      timeStamp: 96
    });

    const bubble = screen.getByTestId("little-alex-chat-bubble");

    expect(bubble).toHaveTextContent("well done everyone");
    expect(bubble.style.transform).toContain("translate3d");
  });

  it("stands mostly still before starting slow idle walking after five seconds untouched", () => {
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

    expect(littleAlex).toHaveAttribute("data-idle-state", "standing");
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
      vi.advanceTimersByTime(3_999);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "standing");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "walking");
  });

  it("waits 1.5 seconds longer before standing after a drag release", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    firePointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    firePointer(grabTarget, "pointermove", {
      clientX: 820,
      clientY: 240,
      pointerId: 1,
      timeStamp: 80
    });
    firePointer(grabTarget, "pointerup", {
      clientX: 820,
      clientY: 240,
      pointerId: 1,
      timeStamp: 96
    });

    act(() => {
      vi.advanceTimersByTime(5_999);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "active");

    act(() => {
      vi.advanceTimersByTime(501);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "standing");
  });

  it("keeps reduced-motion body parts to the right of the desktop side panel", () => {
    stubReducedMotion(true);
    stubPointerCapture();
    stubViewport(1280, 720);

    render(<LittleAlexPhysics />);
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    firePointer(grabTarget, "pointerdown", {
      clientX: 1160,
      clientY: 220,
      pointerId: 1,
      timeStamp: 0
    });
    firePointer(grabTarget, "pointermove", {
      clientX: 40,
      clientY: 220,
      pointerId: 1,
      timeStamp: 80
    });
    firePointer(grabTarget, "pointerup", {
      clientX: 40,
      clientY: 220,
      pointerId: 1,
      timeStamp: 96
    });

    screen.getAllByTestId("little-alex-body-part").forEach((part) => {
      expect(translatedX(part)).toBeGreaterThanOrEqual(256);
    });
  });

  it("plans idle walk turns at least five percent wide and holds direction for three turns", () => {
    const bounds = playAreaBounds({ height: 720, width: 1280 });
    const random = vi.fn(() => 0.99);
    const first = nextIdleWalkTurn(
      { direction: -1, targetX: 1_000, turnsInDirection: 0 },
      1_000,
      bounds,
      random
    );
    const second = nextIdleWalkTurn(first, first.targetX, bounds, random);
    const third = nextIdleWalkTurn(second, second.targetX, bounds, random);
    const fourth = nextIdleWalkTurn(third, third.targetX, bounds, random);
    const minimumTurnDistance = bounds.width * 0.05;

    expect([first, second, third]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ direction: -1, turnsInDirection: 1 }),
        expect.objectContaining({ direction: -1, turnsInDirection: 2 }),
        expect.objectContaining({ direction: -1, turnsInDirection: 3 })
      ])
    );
    expect(random).toHaveBeenCalledTimes(1);
    expect(fourth.direction).toBe(1);

    [
      [1_000, first.targetX],
      [first.targetX, second.targetX],
      [second.targetX, third.targetX],
      [third.targetX, fourth.targetX]
    ].forEach(([from, to]) => {
      expect(Math.abs(to - from)).toBeGreaterThanOrEqual(minimumTurnDistance);
      expect(to).toBeGreaterThanOrEqual(bounds.minX);
      expect(to).toBeLessThanOrEqual(bounds.maxX);
    });
  });

  it("reclamps stale idle walk targets after the play area changes", () => {
    const resizedBounds = playAreaBounds({ height: 720, width: 500 });
    const clamped = clampIdleWalkTurnToBounds(
      { direction: 1, targetX: 1_200, turnsInDirection: 2 },
      resizedBounds
    );
    const next = nextIdleWalkTurn(
      clamped,
      clamped.targetX,
      resizedBounds,
      vi.fn(() => 0.99)
    );

    expect(clamped.targetX).toBeLessThan(resizedBounds.maxX);
    expect(next.targetX).toBeLessThanOrEqual(resizedBounds.maxX);
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

    firePointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1
    });
    firePointer(grabTarget, "pointermove", {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });
    firePointer(grabTarget, "pointerup", {
      clientX: 760,
      clientY: 260,
      pointerId: 1
    });

    expect(littleAlex).toHaveStyle({ pointerEvents: "none" });
    expect(grabTarget).toHaveStyle({ pointerEvents: "auto" });
    expect(torso?.style.transform).not.toBe(initialTransform);
  });
});
