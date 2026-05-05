import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginSplashIllustration } from "./login-splash-illustration";

describe("LoginSplashIllustration", () => {
  it("renders an accessible richer household garden scene", () => {
    render(<LoginSplashIllustration />);

    expect(
      screen.getByRole("img", { name: "Animated Fairplay household garden scene" })
    ).toBeVisible();
    expect(screen.getByTestId("login-splash-sky-layer")).toBeVisible();
    expect(screen.getByTestId("login-splash-nature-layers")).toBeVisible();
    expect(screen.getByTestId("login-splash-house")).toBeVisible();
    expect(screen.getByTestId("login-splash-garden-path")).toBeVisible();
    expect(screen.getByTestId("login-splash-character-group")).toHaveClass(
      "fp-motion-character-breathe"
    );
    expect(screen.getByTestId("login-splash-floating-cards")).toHaveClass(
      "fp-motion-card-float"
    );
    expect(screen.getByTestId("login-splash-task-card-dishes")).toBeVisible();
    expect(screen.getByTestId("login-splash-task-card-laundry")).toBeVisible();
    expect(screen.getByTestId("login-splash-task-card-garden")).toBeVisible();
  });

  it("keeps subtle motion hooks for the scene details", () => {
    render(<LoginSplashIllustration />);

    expect(screen.getByTestId("login-splash-alex")).toHaveClass(
      "fp-motion-persona-bob"
    );
    expect(screen.getByTestId("login-splash-max")).toBeVisible();
    expect(screen.getByTestId("login-splash-cloud")).toHaveClass(
      "fp-motion-cloud-drift"
    );
    expect(screen.getByTestId("login-splash-plant")).toHaveClass(
      "fp-motion-leaf-sway"
    );
    expect(screen.getByTestId("login-splash-spark")).toHaveClass(
      "fp-motion-radar-pulse"
    );
    expect(screen.getByTestId("login-splash-household-board")).toBeVisible();
  });
});
