import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SAFETY_COPY } from "@/lib/safety-copy";
import { OnboardingGuide } from "./onboarding-guide";

describe("onboarding guide", () => {
  it("presents practical setup steps and the unsafe relationship caution", () => {
    const { container } = render(<OnboardingGuide onSkip={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Set up your household rhythm" })
    ).toBeVisible();
    const onboardingBackground = container.querySelector(
      "[data-onboarding-background]"
    );
    expect(onboardingBackground).not.toBeNull();
    expect(onboardingBackground).toHaveStyle({
      backgroundImage:
        "url('/assets/fairplay/generated-ui/backgrounds/onboarding-rhythm-path.png')"
    });
    expect(screen.getByText("Map responsibilities")).toBeVisible();
    expect(screen.getByText("Assign ownership")).toBeVisible();
    expect(screen.getByText("Schedule a check-in")).toBeVisible();
    expect(screen.getByText(SAFETY_COPY.unsafeRelationshipCaution)).toBeVisible();
    expect(screen.queryByText(/therapy/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/crisis support/i)).not.toBeInTheDocument();
  });

  it("allows skipping to app home", () => {
    const onSkip = vi.fn();
    render(<OnboardingGuide onSkip={onSkip} />);

    fireEvent.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(onSkip).toHaveBeenCalled();
  });
});
