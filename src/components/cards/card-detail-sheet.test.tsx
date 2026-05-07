import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CardDetailSheet } from "./card-detail-sheet";

const card = {
  id: "resp_123",
  title: "Auto",
  labels: ["Out", "Daily Grind"],
  boardLane: "cards_of_concern",
  ownerLabel: "Cards of Concern",
  definition: "Keep vehicle needs visible and handled.",
  conception: "Notice repairs and timing.",
  planning: "Schedule service and arrange transport.",
  execution: "Complete service and follow-through.",
  minimumStandard: "Vehicle is safe, legal, and available.",
  householdStandard: "Both drivers can use the car safely each weekday.",
  notes: "Insurance card lives in the glove box.",
  coverAssetPath: "/assets/fairplay/cards/auto.png"
} as const;

describe("CardDetailSheet", () => {
  it("shows source cover, ownership, CPE, standards, and action hooks", async () => {
    const onMove = vi.fn();
    const onFlagForRadar = vi.fn();
    render(
      <CardDetailSheet
        card={card}
        onFlagForRadar={onFlagForRadar}
        onMove={onMove}
      />
    );

    expect(screen.getByRole("heading", { name: "Auto" })).toBeVisible();
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByText("Cards of Concern")).toBeVisible();
    expect(screen.getByText("Out")).toBeVisible();
    expect(screen.getByText("Daily Grind")).toBeVisible();

    const cpe = screen.getByRole("region", { name: /CPE sections/i });
    expect(within(cpe).getByText("Notice repairs and timing.")).toBeVisible();
    expect(within(cpe).getByText("Schedule service and arrange transport.")).toBeVisible();
    expect(within(cpe).getByText("Complete service and follow-through.")).toBeVisible();
    expect(screen.getByText("Vehicle is safe, legal, and available.")).toBeVisible();
    expect(
      screen.getByText("Both drivers can use the car safely each weekday.")
    ).toBeVisible();
    expect(screen.getByText("Insurance card lives in the glove box.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: /move to Player 1/i }));
    await userEvent.click(screen.getByRole("button", { name: /flag for radar/i }));

    expect(onMove).toHaveBeenCalledWith("player_1");
    expect(onFlagForRadar).toHaveBeenCalledTimes(1);
  });

  it("renders accepted AI-generated cover art as a larger integrated panel", () => {
    const generatedCard = {
      ...card,
      title: "Dog Medicine",
      coverAssetPath: null,
      sourceCoverAssetPath:
        "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
    };

    render(<CardDetailSheet card={generatedCard} />);

    const artPanel = screen.getByTestId("generated-cover-art-panel");
    expect(artPanel).toHaveClass("min-h-[520px]");
    expect(artPanel).toHaveClass("lg:min-h-[680px]");
    expect(screen.getByRole("img", { name: /dog medicine cover/i })).toHaveAttribute(
      "src",
      "/api/ai-card-drafts/550e8400-e29b-41d4-a716-446655440099/cover"
    );
    expect(screen.getByRole("img", { name: /dog medicine cover/i })).toHaveClass(
      "object-cover"
    );
  });

  it("renders source-card sourceCoverAssetPath with legacy object-contain art treatment", () => {
    const sourceCard = {
      ...card,
      coverAssetPath: null,
      sourceCoverAssetPath: "/assets/fairplay/cards/auto.png"
    };

    render(<CardDetailSheet card={sourceCard} />);

    expect(screen.queryByTestId("generated-cover-art-panel")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-cover-art-panel")).toBeVisible();
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveAttribute(
      "src",
      "/assets/fairplay/cards/auto.png"
    );
    expect(screen.getByRole("img", { name: /auto cover/i })).toHaveClass(
      "object-contain"
    );
  });

  it("explains card actions are unavailable when no action hooks are wired", () => {
    render(<CardDetailSheet card={card} />);

    expect(
      screen.getByText(
        "Card actions are unavailable on this page. Use the editor below or return to the load map."
      )
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /flag for radar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /schedule check-in/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Trim$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /move to Player 1/i })).toBeDisabled();
  });
});
