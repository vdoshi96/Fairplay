import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FeatureGuideLauncher } from "./feature-guide-launcher";
import { FEATURE_GUIDES } from "./guide-content";

const queryValue = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(queryValue.value)
}));

describe("FeatureGuideLauncher", () => {
  beforeEach(() => {
    queryValue.value = "";
  });

  it("starts a user-triggered feature guide with a board helper scene", () => {
    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.loadMap} />);

    expect(screen.getByTestId("feature-guide-helper-loadMap")).toHaveAttribute(
      "data-helper-scene",
      "lane-board"
    );

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));

    expect(screen.getByRole("dialog", { name: "Board guide" })).toBeVisible();
  });

  it("does not auto-start before the user taps the guide", () => {
    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.library} />);

    expect(screen.queryByRole("dialog", { name: "Library guide" })).not.toBeInTheDocument();
  });

  it("keeps the guide action in a stable placement wrapper", () => {
    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.library} />);

    const action = screen.getByTestId("feature-guide-action-library");

    expect(action).toHaveAttribute("data-feature-guide-action", "primary");
    expect(action).toContainElement(
      screen.getByRole("button", { name: "Learn this feature" })
    );
  });

  it("starts from a guide query only when the user arrived from a guide link", () => {
    queryValue.value = "guide=library";

    render(<FeatureGuideLauncher guide={FEATURE_GUIDES.library} />);

    expect(screen.getByRole("dialog", { name: "Library guide" })).toBeVisible();
  });

  it("starts the Settings guide from the settings query without opening Board", () => {
    queryValue.value = "guide=settings";

    render(
      <>
        <FeatureGuideLauncher guide={FEATURE_GUIDES.loadMap} />
        <FeatureGuideLauncher guide={FEATURE_GUIDES.settings} />
      </>
    );

    const settingsGuide = screen.getByRole("dialog", { name: "Settings guide" });
    expect(settingsGuide).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Board guide" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "About this feature" })
    ).toBeVisible();
    expect(settingsGuide).toHaveTextContent(/settings/i);
  });
});
