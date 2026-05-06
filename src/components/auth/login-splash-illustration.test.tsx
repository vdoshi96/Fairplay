import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginSplashIllustration } from "./login-splash-illustration";

describe("LoginSplashIllustration", () => {
  it("renders an accessible richer household garden scene", () => {
    render(<LoginSplashIllustration />);

    expect(
      screen.getByRole("img", { name: "Animated Fairplay household garden scene" })
    ).toBeVisible();
    expect(screen.getByTestId("login-splash-image")).toHaveAttribute(
      "src",
      "/assets/fairplay/generated-ui/login-household-garden.png"
    );
    expect(screen.getByTestId("login-splash-image")).toHaveAttribute("alt", "");
    expect(screen.getByTestId("login-splash-image")).toHaveAttribute(
      "aria-hidden",
      "true"
    );
  });

  it("keeps subtle motion hooks for the generated scene frame", () => {
    render(<LoginSplashIllustration />);

    expect(screen.getByTestId("login-splash-art-frame")).toHaveClass(
      "fp-motion-card-float"
    );
  });
});
