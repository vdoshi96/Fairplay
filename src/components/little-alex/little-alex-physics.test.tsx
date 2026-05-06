import { fireEvent, render, screen } from "@testing-library/react";
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

describe("LittleAlexPhysics", () => {
  afterEach(() => {
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
