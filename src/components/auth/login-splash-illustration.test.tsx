import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginSplashIllustration } from "./login-splash-illustration";

describe("LoginSplashIllustration", () => {
  it("renders an accessible animated household garden scene", () => {
    render(<LoginSplashIllustration />);

    expect(
      screen.getByRole("img", { name: "Animated Fairplay household garden scene" })
    ).toBeVisible();
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
