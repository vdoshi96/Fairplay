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
const genderPresentations = ["neutral", "masculine", "feminine"] as const;

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

function translatedY(element: HTMLElement) {
  const match = element.style.transform.match(
    /translate3d\(-?\d+(?:\.\d+)?px, (-?\d+(?:\.\d+)?)px/
  );

  if (!match) {
    throw new Error(`Missing translate3d y value: ${element.style.transform}`);
  }

  return Number(match[1]);
}

function partXBounds(element: HTMLElement) {
  const x = translatedX(element);
  const width = Number.parseFloat(element.style.width);

  if (!Number.isFinite(width)) {
    throw new Error(`Missing width value: ${element.style.width}`);
  }

  return {
    maxX: x + width,
    minX: x
  };
}

function partYBounds(element: HTMLElement) {
  const y = translatedY(element);
  const height = Number.parseFloat(element.style.height);

  if (!Number.isFinite(height)) {
    throw new Error(`Missing height value: ${element.style.height}`);
  }

  return {
    maxY: y + height,
    minY: y
  };
}

function expectShouldersToOverlapArmBounds(
  torso: HTMLElement,
  leftArm: HTMLElement,
  rightArm: HTMLElement
) {
  const torsoBounds = partXBounds(torso);
  const leftArmBounds = partXBounds(leftArm);
  const rightArmBounds = partXBounds(rightArm);
  const torsoYBounds = partYBounds(torso);
  const leftArmYBounds = partYBounds(leftArm);
  const rightArmYBounds = partYBounds(rightArm);

  expect(leftArmBounds.maxX).toBeGreaterThan(torsoBounds.minX);
  expect(rightArmBounds.minX).toBeLessThan(torsoBounds.maxX);
  expect(leftArmBounds.maxX - torsoBounds.minX).toBeGreaterThanOrEqual(8);
  expect(torsoBounds.maxX - rightArmBounds.minX).toBeGreaterThanOrEqual(8);
  expect(leftArmYBounds.maxY).toBeGreaterThan(torsoYBounds.minY);
  expect(rightArmYBounds.maxY).toBeGreaterThan(torsoYBounds.minY);
}

function bodyPart(part: string) {
  const element = screen
    .getAllByTestId("little-alex-body-part")
    .find((bodyPartElement) => bodyPartElement.getAttribute("data-part") === part);

  if (!element) {
    throw new Error(`Missing Little Alex body part: ${part}`);
  }

  return element;
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

  it("enters fling ragdoll visual state only after a real non-reduced fling", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics chatPhrase="well done everyone" />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "settled");

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "dragging");

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

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "flinging");
  });

  it("keeps the ragdoll visual state settled for a simple click release", () => {
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
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

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "settled");
  });

  it("recovers the ragdoll visual state on the existing post-release timer", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 800,
      clientY: 240,
      pointerId: 1,
      timeStamp: 64
    });
    dispatchPointer(grabTarget, "pointerup", {
      clientX: 800,
      clientY: 240,
      pointerId: 1,
      timeStamp: 80
    });

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "flinging");

    act(() => {
      vi.advanceTimersByTime(6_499);
    });

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "flinging");

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "recovering");

    act(() => {
      vi.advanceTimersByTime(360);
    });

    expect(littleAlex).toHaveAttribute("data-ragdoll-state", "settled");
  });

  it("reveals limb sprites during fling and hides them again after recovery", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const fullSprite = screen.getByTestId("little-alex-full-sprite");
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    expect(screen.getAllByTestId("little-alex-sprite")).toHaveLength(6);
    expect(fullSprite).toHaveStyle({ opacity: "1" });
    screen.getAllByTestId("little-alex-body-part").forEach((part) => {
      expect(part).toHaveStyle({ opacity: "0" });
    });

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 790,
      clientY: 245,
      pointerId: 1,
      timeStamp: 64
    });
    dispatchPointer(grabTarget, "pointerup", {
      clientX: 790,
      clientY: 245,
      pointerId: 1,
      timeStamp: 80
    });

    expect(fullSprite).toHaveStyle({ opacity: "0" });
    screen.getAllByTestId("little-alex-body-part").forEach((part) => {
      expect(part).toHaveStyle({ opacity: "1" });
      expect(part.querySelector("img")).not.toBeNull();
    });

    act(() => {
      vi.advanceTimersByTime(6_500);
    });

    expect(fullSprite).toHaveStyle({ opacity: "1" });
    screen.getAllByTestId("little-alex-body-part").forEach((part) => {
      expect(part).toHaveStyle({ opacity: "1" });
    });

    act(() => {
      vi.advanceTimersByTime(360);
    });

    expect(fullSprite).toHaveStyle({ opacity: "1" });
    screen.getAllByTestId("little-alex-body-part").forEach((part) => {
      expect(part).toHaveStyle({ opacity: "0" });
    });
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

  it("moves one half-speed idle step when idle walking starts", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    stubViewport(1024, 768);
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const torso = bodyPart("torso");

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "standing");
    const standingX = translatedX(torso);

    act(() => {
      vi.advanceTimersByTime(4_000);
    });

    expect(littleAlex).toHaveAttribute("data-idle-state", "walking");
    expect(Math.abs(translatedX(torso) - standingX)).toBeCloseTo(0.36);
  });

  it("waits 1.5 seconds longer before standing after a drag release", () => {
    vi.useFakeTimers();
    stubReducedMotion(false);
    stubPointerCapture();
    vi.spyOn(Matter.Runner, "run").mockImplementation(() => Matter.Runner.create());

    render(<LittleAlexPhysics />);
    const littleAlex = screen.getByTestId("little-alex-horne");
    const grabTarget = screen.getByTestId("little-alex-grab-target");

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 900,
      clientY: 200,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 820,
      clientY: 240,
      pointerId: 1,
      timeStamp: 80
    });
    dispatchPointer(grabTarget, "pointerup", {
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

    dispatchPointer(grabTarget, "pointerdown", {
      clientX: 1160,
      clientY: 220,
      pointerId: 1,
      timeStamp: 0
    });
    dispatchPointer(grabTarget, "pointermove", {
      clientX: 40,
      clientY: 220,
      pointerId: 1,
      timeStamp: 80
    });
    dispatchPointer(grabTarget, "pointerup", {
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

  it("exposes distinct visible presentation details for every appearance option", () => {
    stubReducedMotion(true);

    const detailSets = genderPresentations.map((genderPresentation) => {
      const { unmount } = render(
        <LittleAlexPhysics genderPresentation={genderPresentation} />
      );

      const littleAlex = screen.getByTestId("little-alex-horne");
      const details = {
        fullSprite: screen.getByTestId("little-alex-full-sprite").getAttribute("src"),
        hair: screen
          .getByTestId("little-alex-full-sprite")
          .getAttribute("data-sprite-hair"),
        head: littleAlex.getAttribute("data-appearance-head"),
        silhouette: littleAlex.getAttribute("data-appearance-silhouette")
      };

      expect(littleAlex).toHaveAttribute(
        "data-gender-presentation",
        genderPresentation
      );
      expect(littleAlex).toHaveClass(
        `fp-little-alex-presentation-${genderPresentation}`
      );
      expect(details.fullSprite).toBe(
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-full.png`
      );
      expect(details.hair).toBeTruthy();
      expect(details.head).toBeTruthy();
      expect(details.silhouette).toBeTruthy();
      unmount();

      return `${details.hair}/${details.head}/${details.fullSprite}/${details.silhouette}`;
    });

    expect(new Set(detailSets).size).toBe(genderPresentations.length);
  });

  it("renders one coherent full-body sprite with hidden body-part sprite images while settled", () => {
    stubReducedMotion(true);

    genderPresentations.forEach((genderPresentation) => {
      const { unmount } = render(
        <LittleAlexPhysics genderPresentation={genderPresentation} />
      );

      const fullSprite = screen.getByTestId("little-alex-full-sprite");

      expect(screen.getAllByTestId("little-alex-sprite")).toHaveLength(6);
      expect(
        screen
          .getAllByTestId("little-alex-sprite")
          .map((sprite) => sprite.getAttribute("src"))
      ).toEqual([
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-head.png`,
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-torso.png`,
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-leftArm.png`,
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-rightArm.png`,
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-leftLeg.png`,
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-rightLeg.png`
      ]);
      expect(fullSprite).toHaveAttribute(
        "src",
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-full.png`
      );
      expect(fullSprite).toHaveStyle({ opacity: "1" });
      expect(fullSprite).toHaveStyle({
        height: "176px",
        width: "86px"
      });
      screen.getAllByTestId("little-alex-body-part").forEach((part) => {
        expect(part).toHaveStyle({ opacity: "0" });
      });

      unmount();
    });
  });

  it("marks the feminine full-body sprite as the long-hair variant", () => {
    stubReducedMotion(true);

    render(<LittleAlexPhysics genderPresentation="feminine" />);
    const fullSprite = screen.getByTestId("little-alex-full-sprite");

    expect(fullSprite).toHaveAttribute("data-sprite-hair", "long-hair");
    expect(fullSprite).toHaveAttribute(
      "src",
      "/assets/fairplay/little-alex-sprites/feminine-full.png"
    );
  });

  it("overlaps reduced-motion arm and torso x bounds at both shoulders", () => {
    stubReducedMotion(true);

    render(<LittleAlexPhysics />);

    const parts = screen.getAllByTestId("little-alex-body-part");
    const [head, torso, leftArm, rightArm, leftLeg, rightLeg] = parts;

    expect(
      parts.map((part) => part.getAttribute("data-part"))
    ).toEqual(["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"]);
    expect(head).toBeInTheDocument();
    expect(leftLeg).toBeInTheDocument();
    expect(rightLeg).toBeInTheDocument();
    expectShouldersToOverlapArmBounds(torso, leftArm, rightArm);
  });

  it("keeps reduced-motion head, torso, and legs vertically connected", () => {
    stubReducedMotion(true);

    render(<LittleAlexPhysics />);

    const [head, torso, , , leftLeg, rightLeg] =
      screen.getAllByTestId("little-alex-body-part");
    const headBounds = partYBounds(head);
    const torsoBounds = partYBounds(torso);
    const leftLegBounds = partYBounds(leftLeg);
    const rightLegBounds = partYBounds(rightLeg);
    const headToTorsoGap = torsoBounds.minY - headBounds.maxY;
    const leftHipGap = leftLegBounds.minY - torsoBounds.maxY;
    const rightHipGap = rightLegBounds.minY - torsoBounds.maxY;

    expect(headToTorsoGap).toBeGreaterThanOrEqual(-2);
    expect(headToTorsoGap).toBeLessThanOrEqual(4);
    expect(leftHipGap).toBeLessThanOrEqual(2);
    expect(rightHipGap).toBeLessThanOrEqual(2);
  });

  it("keeps the hidden body-part contract and full-body suit asset across appearance options", () => {
    stubReducedMotion(true);

    genderPresentations.forEach((genderPresentation) => {
      const { unmount } = render(
        <LittleAlexPhysics
          genderPresentation={genderPresentation}
          skinTone="tone_4"
        />
      );

      expect(
        screen
          .getAllByTestId("little-alex-body-part")
          .map((part) => part.getAttribute("data-part"))
      ).toEqual(["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"]);
      screen.getAllByTestId("little-alex-body-part").forEach((part) => {
        expect(part).toHaveStyle({ opacity: "0" });
      });
      expect(screen.getByTestId("little-alex-horne")).toHaveStyle({
        "--little-alex-skin": "#b7795f"
      });
      expect(screen.getByTestId("little-alex-full-sprite")).toHaveAttribute(
        "src",
        `/assets/fairplay/little-alex-sprites/${genderPresentation}-full.png`
      );
      expect(screen.getAllByTestId("little-alex-sprite")).toHaveLength(6);

      unmount();
    });
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
    expect(screen.getByTestId("little-alex-chat-bubble")).toHaveTextContent(
      "i'm little alex horne"
    );
  });
});
