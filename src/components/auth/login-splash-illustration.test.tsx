import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoginSplashIllustration } from "./login-splash-illustration";

describe("LoginSplashIllustration", () => {
  it("renders an accessible richer household garden scene", () => {
    const { container } = render(<LoginSplashIllustration />);

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
    expect(
      container.querySelector('source[type="image/avif"][media]')
    ).toHaveAttribute(
      "srcset",
      expect.stringContaining("login-household-garden-768.avif")
    );
    expect(
      container.querySelector('source[type="image/webp"]:not([media])')
    ).toHaveAttribute(
      "srcset",
      "/assets/fairplay/generated-ui/login-household-garden-1536.webp"
    );
  });

  it("keeps subtle motion hooks for the generated scene frame", () => {
    render(<LoginSplashIllustration />);

    expect(screen.getByTestId("login-splash-art-frame")).toHaveClass(
      "fp-motion-card-float"
    );
  });
});
